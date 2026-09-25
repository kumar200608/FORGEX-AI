import json
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, make_response
from config import Config
import db

app = Flask(__name__)
app.config.from_object(Config)

# Initialize Database Schema & Initial Data
with app.app_context():
    db.init_db()

@app.after_request
def add_client_hints_headers(response):
    # Advertise supported client hints for network & device adaptation
    response.headers['Accept-CH'] = 'Save-Data, ECT, Sec-CH-UA-Memory, Downlink, RTT'
    response.headers['Vary'] = 'Accept-CH, Save-Data, ECT, Sec-CH-UA-Memory'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/order-confirmation/<int:order_id>')
def order_confirmation(order_id):
    order = db.query_one("SELECT * FROM orders WHERE id = %s", (order_id,))
    if not order:
        return redirect(url_for('index'))
    
    order_items = db.query_all("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
    return render_template('order_success.html', order=order, items=order_items)

# API ENDPOINTS

@app.route('/api/categories', methods=['GET'])
def get_categories():
    department = request.args.get('department')
    if department:
        categories = db.query_all("SELECT * FROM categories WHERE department = %s ORDER BY name ASC", (department,))
    else:
        categories = db.query_all("SELECT * FROM categories ORDER BY department ASC, name ASC")
    return jsonify({'success': True, 'categories': categories})

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        department = request.args.get('department')
        category_id = request.args.get('category_id')
        query_str = request.args.get('q')
        is_featured = request.args.get('featured')
        
        # Detect Tier from Client Hints or Query Param
        save_data_header = (request.headers.get('Save-Data') or '').lower() == 'on'
        ect_header = (request.headers.get('ECT') or '').lower()
        tier_param = (request.args.get('tier') or '').lower()
        
        is_low_tier = save_data_header or ect_header in ['2g', 'slow-2g', '3g'] or tier_param == 'low'
        is_medium_tier = tier_param == 'medium' or ect_header == '3g'
        
        sql = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1"
        params = []
        
        if department and department in ['food', 'dress']:
            sql += " AND p.department = %s"
            params.append(department)
            
        if category_id:
            sql += " AND p.category_id = %s"
            params.append(category_id)
            
        if is_featured and is_featured.lower() in ['1', 'true']:
            sql += " AND p.is_featured = 1"
            
        if query_str:
            sql += " AND (p.name LIKE %s OR p.description LIKE %s OR c.name LIKE %s)"
            like_str = f"%{query_str}%"
            params.extend([like_str, like_str, like_str])
            
        sql += " ORDER BY p.is_featured DESC, p.id ASC"
        
        products = db.query_all(sql, tuple(params))
        
        # Adaptive Image Transformation & Attribute Parsing
        for p in products:
            # Parse JSON attributes
            if isinstance(p.get('attributes'), str):
                try:
                    p['attributes'] = json.loads(p['attributes'])
                except Exception:
                    p['attributes'] = {}
            elif not p.get('attributes'):
                p['attributes'] = {}

            # Adaptive Image URL formatting based on tier
            if p.get('image_url') and 'unsplash.com' in p['image_url']:
                base_url = p['image_url'].split('?')[0]
                if is_low_tier:
                    # Compressed WebP thumbnail for slow 3G / low-end profiles (sub-1.8s LCP)
                    p['image_url'] = f"{base_url}?auto=format&fit=crop&w=320&q=35&fm=webp"
                elif is_medium_tier:
                    p['image_url'] = f"{base_url}?auto=format&fit=crop&w=450&q=60&fm=webp"
                else:
                    p['image_url'] = f"{base_url}?auto=format&fit=crop&w=600&q=80"

        resp = make_response(jsonify({
            'success': True,
            'products': products,
            'count': len(products),
            'adaptive_tier': 'low' if is_low_tier else ('medium' if is_medium_tier else 'high'),
            'save_data': save_data_header
        }))

        # Add HTTP Prefetch Link header if high performance tier
        if not is_low_tier and not save_data_header:
            resp.headers['Link'] = '</api/categories>; rel=prefetch'

        return resp
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = db.query_one("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = %s", (product_id,))
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
        
    if isinstance(product.get('attributes'), str):
        try:
            product['attributes'] = json.loads(product['attributes'])
        except Exception:
            product['attributes'] = {}
            
    return jsonify({'success': True, 'product': product})

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Invalid request body'}), 400
        
    customer_name = data.get('customer_name')
    customer_email = data.get('customer_email')
    customer_phone = data.get('customer_phone')
    shipping_address = data.get('shipping_address')
    payment_method = data.get('payment_method', 'Credit/Debit Card')
    cart_items = data.get('cart_items', [])
    
    if not customer_name or not customer_email or not customer_phone or not shipping_address or not cart_items:
        return jsonify({'success': False, 'message': 'Please fill out all required shipping and contact details'}), 400
        
    # Calculate Total
    total_amount = 0.0
    items_to_insert = []
    
    for item in cart_items:
        prod_id = item.get('product_id')
        qty = int(item.get('quantity', 1))
        options = item.get('selected_options', '')
        
        product = db.query_one("SELECT * FROM products WHERE id = %s", (prod_id,))
        if product:
            price = float(product['price'])
            line_total = price * qty
            total_amount += line_total
            items_to_insert.append({
                'product_id': prod_id,
                'product_name': product['name'],
                'unit_price': price,
                'quantity': qty,
                'selected_options': options,
                'total_price': line_total
            })
            
    # Add estimated tax & shipping
    tax = round(total_amount * 0.08, 2)
    shipping = 4.99 if total_amount > 0 else 0.0
    grand_total = round(total_amount + tax + shipping, 2)
    
    order_number = "ORD-" + datetime.now().strftime("%Y%m%d") + "-" + str(uuid.uuid4())[:6].upper()
    
    order_id = db.execute_commit(
        """
        INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, payment_method, total_amount, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (order_number, customer_name, customer_email, customer_phone, shipping_address, payment_method, grand_total, 'Confirmed')
    )
    
    for item in items_to_insert:
        db.execute_commit(
            """
            INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, selected_options, total_price)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (order_id, item['product_id'], item['product_name'], item['unit_price'], item['quantity'], item['selected_options'], item['total_price'])
        )
        
    return jsonify({
        'success': True,
        'order_id': order_id,
        'order_number': order_number,
        'total_amount': grand_total,
        'message': 'Order successfully placed!'
    })

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order_details(order_id):
    order = db.query_one("SELECT * FROM orders WHERE id = %s", (order_id,))
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
        
    items = db.query_all("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
    return jsonify({'success': True, 'order': order, 'items': items})

if __name__ == '__main__':
    print("Starting Adaptive Taste & Trend E-Commerce Server...")
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5000)