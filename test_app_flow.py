"""
Automated validation of AutoLite AI Streamlit App using AppTest.
Tests:
1. Default scenario (Scenario 1): RAM 1GB, Latency 4.0s, Accuracy 70% -> Quantized recommended.
2. Clicking 'Prepare Deployment' -> Deployment ZIP assembled and download button rendered.
3. Scenario 2: Latency 2.5s, Accuracy 50% -> Distilled recommended.
4. Impossible Scenario: Accuracy 85% -> No model satisfies constraints message.
"""

import sys
import io

# Force UTF-8 on Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from streamlit.testing.v1 import AppTest

print("=== STARTING AUTOLITE AI STREAMLIT TEST SUITE ===")

# -------------------------------------------------------------
# TEST 1: Default Scenario 1
# -------------------------------------------------------------
print("\n--- TEST 1: Default Scenario 1 ---")
at = AppTest.from_file("app/app.py", default_timeout=30)
at.run()
assert len(at.exception) == 0, f"Exceptions occurred: {at.exception}"

# Check recommended model in session or markdown
markdown_texts = [m.value for m in at.markdown]
has_quantized_banner = any("QUANTIZED" in text for text in markdown_texts)
print(f"Quantized banner found: {has_quantized_banner}")
assert has_quantized_banner, "Default scenario should recommend QUANTIZED!"

# -------------------------------------------------------------
# TEST 2: Prepare Deployment Button Click
# -------------------------------------------------------------
print("\n--- TEST 2: Prepare Deployment Button Click ---")
# Find button
prepare_btn = None
for b in at.button:
    if "DEPLOYMENT" in b.label:
        prepare_btn = b
        break

assert prepare_btn is not None, "Prepare Deployment button should exist!"
print(f"Found button: {prepare_btn.label}")

# Click button and rerun
prepare_btn.click().run()
assert len(at.exception) == 0, f"Exceptions after click: {at.exception}"

# Verify download button rendered
download_buttons = [db for db in at.download_button]
print(f"Download buttons found: {len(download_buttons)}")
assert len(download_buttons) > 0, "Download button must be rendered after clicking prepare deployment!"
print(f"Download button label: {download_buttons[0].label}")
assert "quantized" in download_buttons[0].label.lower(), "Download button should reference quantized model!"

# Verify deployment zip bytes are present
zip_bytes = at.session_state["deployment_zip_bytes"]
assert zip_bytes is not None and len(zip_bytes) > 0, "ZIP bytes must be stored in session_state!"
print(f"Generated ZIP size: {len(zip_bytes)} bytes")

# -------------------------------------------------------------
# TEST 3: Scenario 2 (Latency 2.5s, Accuracy 50%)
# -------------------------------------------------------------
print("\n--- TEST 3: Scenario 2 (Latency 2.5s, Accuracy 50%) ---")
at2 = AppTest.from_file("app/app.py", default_timeout=30)
at2.run()

# Change number inputs: max_latency = 2.5, min_accuracy = 50.0
for ni in at2.number_input:
    if "LATENCY" in ni.label:
        ni.set_value(2.5)
    elif "ACCURACY" in ni.label:
        ni.set_value(50.0)

at2.run()
assert len(at2.exception) == 0, f"Exceptions in scenario 2: {at2.exception}"

texts2 = [m.value for m in at2.markdown]
has_distilled_banner = any("DISTILLED" in text for text in texts2)
print(f"Distilled banner found: {has_distilled_banner}")
assert has_distilled_banner, "Scenario 2 should recommend DISTILLED!"

# -------------------------------------------------------------
# TEST 4: Impossible Scenario (Accuracy 85%)
# -------------------------------------------------------------
print("\n--- TEST 4: Impossible Scenario (Accuracy 85%) ---")
for ni in at2.number_input:
    if "ACCURACY" in ni.label:
        ni.set_value(85.0)

at2.run()
assert len(at2.exception) == 0, f"Exceptions in impossible scenario: {at2.exception}"

texts3 = [m.value for m in at2.markdown]
has_no_model = any("NO MODEL SATISFIES ALL CURRENT CONSTRAINTS" in text for text in texts3)
print(f"Empty state banner found: {has_no_model}")
assert has_no_model, "Accuracy 85% must result in NO MODEL SATISFIES constraints!"

print("\n=== ALL STREAMLIT APP TESTS PASSED SUCCESSFULLY! ===")
