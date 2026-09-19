import typer

from app.database import SessionLocal, init_db
from app.models import AccountType, User
from app.utils import hash, is_strong_password

app = typer.Typer()


@app.command()
def create_tables():
    init_db()
    print("Postgres tables created.")


@app.command()
def create_admin(username: str = typer.Option(..., "--username", "-u"), email: str = typer.Option(..., "--email", "-e")):
    password = typer.prompt("Enter password", hide_input=True)
    confirm = typer.prompt("Confirm password", hide_input=True)
    if password != confirm:
        raise typer.Exit("Passwords do not match.")
    if not is_strong_password(password):
        raise typer.Exit("Password is not strong enough.")
    db = SessionLocal()
    try:
        user = User(
            username=username,
            email=email,
            password=hash(password),
            account_type=AccountType.SCHOOL_ADMIN,
        )
        db.add(user)
        db.commit()
        print(f"School admin '{username}' created.")
    finally:
        db.close()


@app.command()
def seed_db():
    from seed_db import seed

    seed()


if __name__ == "__main__":
    app()
