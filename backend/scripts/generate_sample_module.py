"""Generate a sample PPTX module for a given topic."""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.pptx_generator import PPTXGenerator
from app.services.template_engine import TemplateEngine

# Create templates directory if it doesn't exist
TEMPLATES_SAMPLES_DIR = Path(__file__).parent.parent / "templates" / "samples"
TEMPLATES_SAMPLES_DIR.mkdir(parents=True, exist_ok=True)


def generate_sample_module(topic: str):
    """Generate a sample PPTX module for the given topic."""
    template_engine = TemplateEngine()
    pptx_generator = PPTXGenerator(exports_path=str(TEMPLATES_SAMPLES_DIR))
    
    # Get template data
    response_data = template_engine.generate_response(topic, "Sample Cluster")
    
    # Generate title
    title = f"{topic.replace('-', ' ').title()} - Micro Module"
    
    # Generate filename
    filename = f"{topic}-module.pptx"
    
    # Generate PPTX
    output_path = pptx_generator.generate_micro_module(
        title=title,
        topic=topic,
        advice=response_data["advice"],
        materials=response_data.get("materials", "varies"),
        cluster="Sample Cluster",
        output_filename=filename
    )
    
    print(f"✅ Generated sample module: {output_path}")
    print(f"   Topic: {topic}")
    print(f"   Title: {title}")
    print(f"   File: {filename}")
    
    return output_path


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate sample PPTX module")
    parser.add_argument(
        "--topic",
        type=str,
        default="subtraction-borrowing",
        help="Topic tag (e.g., subtraction-borrowing, fractions-conceptual)"
    )
    args = parser.parse_args()
    
    # Validate topic
    template_engine = TemplateEngine()
    all_topics = template_engine.get_all_topics()
    
    if args.topic not in all_topics:
        print(f"⚠️  Warning: Topic '{args.topic}' not in templates. Using 'general'.")
        topic = "general"
    else:
        topic = args.topic
    
    generate_sample_module(topic)


if __name__ == "__main__":
    main()
