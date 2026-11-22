import logging
import os
import ssl

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

logger = logging.getLogger(__name__)


def _database_url() -> URL:
    """DATABASE_URL completa ou, na falta dela, as partes DB_HOST/DB_USER/DB_PASSWORD/..."""
    if os.getenv("DATABASE_URL"):
        return make_url(os.environ["DATABASE_URL"])
    return URL.create(
        "mysql+pymysql",
        username=os.getenv("DB_USER", "enrollment_user"),
        password=os.getenv("DB_PASSWORD", "enrollment_pass"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3308")),
        database=os.getenv("DB_NAME", "enrollment_db"),
    )


DATABASE_URL = _database_url()

# MySQL na nuvem (ex.: TiDB Cloud) exige conexão TLS
connect_args = {}
if os.getenv("DB_SSL", "false").lower() in ("1", "true", "yes"):
    connect_args["ssl"] = ssl.create_default_context()

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=280, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def ensure_database() -> None:
    """Cria o banco do serviço caso ainda não exista (necessário no MySQL da nuvem)."""
    if DATABASE_URL.get_backend_name() != "mysql" or not DATABASE_URL.database:
        return
    # _replace (e não .set) porque .set(database=None) mantém o valor atual
    server = create_engine(DATABASE_URL._replace(database=None), connect_args=connect_args)
    try:
        with server.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DATABASE_URL.database}`"))
    except Exception as exc:  # sem permissão ou servidor ainda subindo: create_all trata
        logger.info("CREATE DATABASE ignorado: %s", exc)
    finally:
        server.dispose()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
