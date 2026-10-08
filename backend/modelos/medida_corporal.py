from sqlalchemy import Column, Integer, Numeric, Date, ForeignKey

from database import Base


class MedidaCorporal(Base):
    __tablename__ = "medidas_corporales"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    usuario_id = Column(
        Integer,
        ForeignKey(
            "usuarios.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    fecha_medicion = Column(
        Date,
        nullable=False
    )

    peso = Column(
        Numeric(6, 2),
        nullable=True
    )

    altura = Column(
        Numeric(5, 2),
        nullable=True
    )

    pecho = Column(
        Numeric(5, 2),
        nullable=True
    )

    cintura = Column(
        Numeric(5, 2),
        nullable=True
    )

    cadera = Column(
        Numeric(5, 2),
        nullable=True
    )

    brazo_izquierdo = Column(
        Numeric(5, 2),
        nullable=True
    )

    brazo_derecho = Column(
        Numeric(5, 2),
        nullable=True
    )

    muslo_izquierdo = Column(
        Numeric(5, 2),
        nullable=True
    )

    muslo_derecho = Column(
        Numeric(5, 2),
        nullable=True
    )