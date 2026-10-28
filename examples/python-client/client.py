"""
OpenReport Python Integration Example
Demonstrates generating and fetching reports from Python using OpenReport CLI or HTTP API.
"""

import subprocess
import json
import os

def generate_pdf_via_cli(report_path: str, output_path: str):
    """Generates a PDF using the local OpenReport CLI."""
    cmd = ["node", "packages/cli/dist/index.js", "export", report_path, "--format", "pdf", "--output", output_path]
    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✓ PDF generated successfully at {output_path}")
    else:
        print(f"✗ Failed to generate PDF: {result.stderr}")

def create_dynamic_report_payload(invoice_id: str, items: list) -> dict:
    """Builds a declarative OpenReport JSON specification dynamically in Python."""
    return {
        "schemaVersion": "1.0.0",
        "id": f"invoice-{invoice_id}",
        "title": f"Tax Invoice #{invoice_id}",
        "page": {
            "size": "A4",
            "orientation": "portrait",
            "margins": {"top": 36, "right": 36, "bottom": 36, "left": 36},
            "unit": "pt"
        },
        "dataSources": [
            {
                "id": "itemsSource",
                "provider": "memory",
                "data": items
            }
        ],
        "datasets": [
            {
                "id": "itemsDataset",
                "dataSourceId": "itemsSource"
            }
        ],
        "bands": {
            "detail": {
                "id": "detail-band",
                "type": "detail",
                "height": 200,
                "elements": [
                    {
                        "id": "title",
                        "type": "text",
                        "x": 0,
                        "y": 0,
                        "width": 300,
                        "height": 24,
                        "text": f"Invoice #{invoice_id}"
                    }
                ]
            }
        }
    }

if __name__ == "__main__":
    sample_items = [
        {"desc": "Cloud Database Hosting", "qty": 1, "price": 450.0},
        {"desc": "Load Balancer Bandwidth", "qty": 5, "price": 20.0}
    ]
    report_dict = create_dynamic_report_payload("PY-2026-001", sample_items)
    
    # Save temporary report definition
    temp_json = "temp_py_report.json"
    with open(temp_json, "w") as f:
        json.dump(report_dict, f, indent=2)
        
    print(f"Generated dynamic report JSON: {temp_json}")
    
    # If node is present, export directly
    if os.path.exists("packages/cli/dist/index.js"):
        generate_pdf_via_cli(temp_json, "python_generated_invoice.pdf")
        if os.path.exists(temp_json):
            os.remove(temp_json)
