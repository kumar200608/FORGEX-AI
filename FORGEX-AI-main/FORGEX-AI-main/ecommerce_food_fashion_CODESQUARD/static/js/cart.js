// Taste & Trend E-Commerce - Cart & Checkout Module
const CartModule = {
    cart: [],
    init() {
        const saved = localStorage.getItem('taste_trend_cart');
        if (saved) {
            try {
                this.cart = JSON.parse(saved);
            } catch (e) {
                this.cart = [];
            }
        }
        this.bindEvents();
        this.render();
    },
    save() {
        localStorage.setItem('taste_trend_cart', JSON.stringify(this.cart));
        this.render();
    },
    addItem(product, quantity = 1, selectedOptions = '') {
        const existingIndex = this.cart.findIndex(item => item.product_id === product.id && item.selected_options === selectedOptions);
        if (existingIndex > -1) {
            this.cart[existingIndex].quantity += quantity;
        } else {
            this.cart.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                selected_options: selectedOptions
            });
        }
        this.save();
    },
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('add-to-cart-btn')) {
                const productId = e.target.dataset.id;
                const productName = e.target.dataset.name;
                const productPrice = parseFloat(e.target.dataset.price);
                this.addItem({ id: productId, name: productName, price: productPrice });
            }
        });
    },
    render() {
        const badge = document.querySelector('#cart-count');
        if (badge) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            badge.textContent = totalItems;
        }
    }
};