"""Seed database with sample data."""
import sys
import os
import csv

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.models import Cluster, TeacherQuery, DIETUser
from app.utils.privacy import hash_phone_number


def seed_database():
    """Seed database with sample queries."""
    db = SessionLocal()
    
    try:
        print("Starting database seed...")
        
        # Create clusters
        clusters = {
            "Cluster A": Cluster(name="Cluster A", region="North Bihar"),
            "Cluster B": Cluster(name="Cluster B", region="South Bihar"),
            "Cluster C": Cluster(name="Cluster C", region="Central Bihar"),
        }
        
        for cluster in clusters.values():
            existing = db.query(Cluster).filter(Cluster.name == cluster.name).first()
            if not existing:
                db.add(cluster)
                print(f"Created cluster: {cluster.name}")
        
        db.commit()
        
        # Refresh clusters to get IDs
        for name in clusters:
            clusters[name] = db.query(Cluster).filter(Cluster.name == name).first()
        
        # Create DIET user
        diet_user = db.query(DIETUser).filter(DIETUser.email == "admin@diet.edu").first()
        if not diet_user:
            diet_user = DIETUser(
                name="DIET Admin",
                email="admin@diet.edu",
                role="administrator"
            )
            db.add(diet_user)
            db.commit()
            print("Created DIET user")
        
        # Load sample queries from CSV
        csv_path = os.path.join(os.path.dirname(__file__), 'sample_queries.csv')
        
        if not os.path.exists(csv_path):
            print(f"Warning: {csv_path} not found. Skipping query import.")
            return
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            
            for row in reader:
                # Hash phone number
                phone_hash = hash_phone_number(row['phone'])
                
                # Get cluster
                cluster = clusters[row['cluster']]
                
                # Create query
                query = TeacherQuery(
                    phone_hash=phone_hash,
                    cluster_id=cluster.id,
                    topic_tag=row['topic'],
                    narrative_text=row['text'],
                    consent_given=row['consent_given'].lower() == 'true'
                )
                
                db.add(query)
                count += 1
            
            db.commit()
            print(f"Created {count} sample queries")
        
        print("\n✅ Database seeded successfully!")
        print(f"Access frontend at: http://localhost:3000")
        print(f"Access API docs at: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()