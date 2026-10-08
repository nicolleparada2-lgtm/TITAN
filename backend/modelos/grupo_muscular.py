from sqlalchemy import Column, Integer, String

from database import Base


class GrupoMuscular(Base):
    __tablename__ = "grupos_musculares"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)