"""Seed script for demo data - creates 10-20 teacher queries across 3 clusters."""
import sys
import os
import csv
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, init_db
from app.models import Cluster, TeacherQuery
from app.utils.privacy import hash_phone_number

# Built-in demo data
DEMO_DATA = [
    {
        "phone": "+919876543210",
        "cluster": "Cluster A",
        "topic": "subtraction-borrowing",
        "text": "Students confused about subtraction borrowing when there's a zero in tens place",
        "consent_given": True
    },
    {
        "phone": "+919876543211",
        "cluster": "Cluster A",
        "topic": "subtraction-borrowing",
        "text": "How to teach borrowing in subtraction? My class struggles with this concept",
        "consent_given": True
    },
    {
        "phone": "+919876543212",
        "cluster": "Cluster A",
        "topic": "fractions-conceptual",
        "text": "Students don't understand what 1/2 means. They think it's just a number",
        "consent_given": True
    },
    {
        "phone": "+919876543213",
        "cluster": "Cluster A",
        "topic": "multiplication-tables",
        "text": "Children can't memorize multiplication tables. Need better methods",
        "consent_given": True
    },
    {
        "phone": "+919876543214",
        "cluster": "Cluster B",
        "topic": "subtraction-borrowing",
        "text": "Zero in tens place causes confusion during borrowing",
        "consent_given": True
    },
    {
        "phone": "+919876543215",
        "cluster": "Cluster B",
        "topic": "classroom-management",
        "text": "Class is very noisy and I can't get their attention during lessons",
        "consent_given": True
    },
    {
        "phone": "+919876543216",
        "cluster": "Cluster B",
        "topic": "fractions-conceptual",
        "text": "How to explain fractions using concrete materials?",
        "consent_given": True
    },
    {
        "phone": "+919876543217",
        "cluster": "Cluster B",
        "topic": "parent-engagement",
        "text": "Parents don't come to school meetings. How to engage them?",
        "consent_given": True
    },
    {
        "phone": "+919876543218",
        "cluster": "Cluster C",
        "topic": "reading-fluency",
        "text": "Students read very slowly. How to improve reading speed?",
        "consent_given": True
    },
    {
        "phone": "+919876543219",
        "cluster": "Cluster C",
        "topic": "subtraction-borrowing",
        "text": "Borrowing concept is difficult for grade 3 students",
        "consent_given": True
    },
    {
        "phone": "+919876543220",
        "cluster": "Cluster C",
        "topic": "assessment-formative",
        "text": "How to quickly check if students understood the lesson?",
        "consent_given": True
    },
    {
        "phone": "+919876543221",
        "cluster": "Cluster C",
        "topic": "differentiation",
        "text": "I have mixed ability students. How to teach same topic to all?",
        "consent_given": True
    },
    {
        "phone": "+919876543222",
        "cluster": "Cluster A",
        "topic": "absenteeism",
        "text": "Many students are absent regularly. What can I do?",
        "consent_given": True
    },
    {
        "phone": "+919876543223",
        "cluster": "Cluster B",
        "topic": "multiplication-tables",
        "text": "Times tables are boring. Need engaging activities",
        "consent_given": True
    },
    {
        "phone": "+919876543224",
        "cluster": "Cluster C",
        "topic": "fractions-conceptual",
        "text": "Students confuse 1/2 and 2/1. Need help with fraction concepts",
        "consent_given": True
    }
]


def seed_from_csv(csv_path: str, db: SessionLocal):
    """Seed database from CSV file."""
    clusters = {}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        
        for row in reader:
            # Get or create cluster
            cluster_name = row.get('cluster', 'Default Cluster')
            if cluster_name not in clusters:
                cluster = db.query(Cluster).filter(Cluster.name == cluster_name).first()
                if not cluster:
                    cluster = Cluster(name=cluster_name, region="Demo Region")
                    db.add(cluster)
                    db.commit()
                    db.refresh(cluster)
                clusters[cluster_name] = cluster
            
            cluster = clusters[cluster_name]
            
            # Hash phone number
            phone_hash = hash_phone_number(row['phone'])
            
            # Create query
            query = TeacherQuery(
                phone_hash=phone_hash,
                cluster_id=cluster.id,
                topic_tag=row.get('topic', 'general'),
                narrative_text=row.get('text', ''),
                consent_given=row.get('consent_given', 'true').lower() == 'true'
            )
            db.add(query)
            count += 1
        
        db.commit()
        print(f"✅ Created {count} queries from CSV")
        return count


def seed_builtin(db: SessionLocal):
    """Seed database with built-in demo data."""
    clusters = {}
    count = 0
    
    for data in DEMO_DATA:
        # Get or create cluster
        cluster_name = data['cluster']
        if cluster_name not in clusters:
            cluster = db.query(Cluster).filter(Cluster.name == cluster_name).first()
            if not cluster:
                cluster = Cluster(name=cluster_name, region="Demo Region")
                db.add(cluster)
                db.commit()
                db.refresh(cluster)
            clusters[cluster_name] = cluster
        
        cluster = clusters[cluster_name]
        
        # Hash phone number
        phone_hash = hash_phone_number(data['phone'])
        
        # Check if query already exists (avoid duplicates)
        existing = db.query(TeacherQuery).filter(
            TeacherQuery.phone_hash == phone_hash,
            TeacherQuery.narrative_text == data['text']
        ).first()
        
        if existing:
            continue
        
        # Create query
        query = TeacherQuery(
            phone_hash=phone_hash,
            cluster_id=cluster.id,
            topic_tag=data['topic'],
            narrative_text=data['text'],
            consent_given=data['consent_given']
        )
        db.add(query)
        count += 1
    
    db.commit()
    print(f"✅ Created {count} new queries from built-in data")
    return count


def main():
    """Main seed function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed demo data into EduPulse database")
    parser.add_argument(
        "--csv",
        type=str,
        help="Path to CSV file with columns: phone, cluster, topic, text, consent_given"
    )
    args = parser.parse_args()
    
    # Initialize database
    init_db()
    
    # Create database session
    db = SessionLocal()
    
    try:
        if args.csv:
            if not os.path.exists(args.csv):
                print(f"❌ CSV file not found: {args.csv}")
                return
            seed_from_csv(args.csv, db)
        else:
            seed_builtin(db)
        
        # Print summary
        total_queries = db.query(TeacherQuery).count()
        total_clusters = db.query(Cluster).count()
        
        print(f"\n📊 Database Summary:")
        print(f"   Total queries: {total_queries}")
        print(f"   Total clusters: {total_clusters}")
        print(f"\n✅ Seeding complete!")
        print(f"   Access API docs: http://127.0.0.1:8000/docs")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
