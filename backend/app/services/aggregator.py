"""Aggregation service for DIET dashboard analytics."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Dict, List, Optional
from app.models import TeacherQuery, Cluster


class AggregationService:
    """Service for aggregating and analyzing teacher queries."""
    
    @staticmethod
    def get_aggregated_stats(
        db: Session,
        cluster: Optional[str] = None,
        topic: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict:
        """
        Get aggregated statistics with filters.
        
        Args:
            db: Database session
            cluster: Filter by cluster name
            topic: Filter by topic tag
            date_from: ISO date string
            date_to: ISO date string
        
        Returns:
            Dict with counts, breakdowns, and sample queries
        """
        # Base query
        query = db.query(TeacherQuery)
        
        # Apply filters
        if cluster:
            cluster_obj = db.query(Cluster).filter(Cluster.name == cluster).first()
            if cluster_obj:
                query = query.filter(TeacherQuery.cluster_id == cluster_obj.id)
        
        if topic:
            query = query.filter(TeacherQuery.topic_tag == topic)
        
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from)
                query = query.filter(TeacherQuery.created_at >= from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to)
                query = query.filter(TeacherQuery.created_at <= to_date)
            except ValueError:
                pass
        
        # Total count
        total_queries = query.count()
        
        # By topic
        by_topic = {}
        topic_counts = db.query(
            TeacherQuery.topic_tag,
            func.count(TeacherQuery.id)
        ).group_by(TeacherQuery.topic_tag)
        
        if cluster:
            topic_counts = topic_counts.filter(
                TeacherQuery.cluster_id == cluster_obj.id
            )
        
        for topic_name, count in topic_counts.all():
            by_topic[topic_name] = count
        
        # By cluster
        by_cluster = {}
        cluster_counts = db.query(
            Cluster.name,
            func.count(TeacherQuery.id)
        ).join(TeacherQuery).group_by(Cluster.name)
        
        if topic:
            cluster_counts = cluster_counts.filter(
                TeacherQuery.topic_tag == topic
            )
        
        for cluster_name, count in cluster_counts.all():
            by_cluster[cluster_name] = count
        
        # Sample queries (limit 10)
        sample_queries = query.order_by(
            TeacherQuery.created_at.desc()
        ).limit(10).all()
        
        return {
            "total_queries": total_queries,
            "by_topic": by_topic,
            "by_cluster": by_cluster,
            "sample_queries": [
                {
                    "id": q.id,
                    "cluster_id": q.cluster_id,
                    "topic_tag": q.topic_tag,
                    "narrative_text": q.narrative_text[:200] + "..." if len(q.narrative_text) > 200 else q.narrative_text,
                    "created_at": q.created_at.isoformat(),
                    "resolved": q.resolved,
                    "flagged_for_crp": q.flagged_for_crp
                }
                for q in sample_queries
            ]
        }
    
    @staticmethod
    def get_topic_trends(db: Session, days: int = 30) -> List[Dict]:
        """
        Get topic trends over time.
        
        Args:
            db: Database session
            days: Number of days to look back
        
        Returns:
            List of dicts with date and topic counts
        """
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        results = db.query(
            func.date(TeacherQuery.created_at).label('date'),
            TeacherQuery.topic_tag,
            func.count(TeacherQuery.id).label('count')
        ).filter(
            TeacherQuery.created_at >= cutoff_date
        ).group_by(
            func.date(TeacherQuery.created_at),
            TeacherQuery.topic_tag
        ).order_by('date').all()
        
        return [
            {
                "date": str(r.date),
                "topic": r.topic_tag,
                "count": r.count
            }
            for r in results
        ]