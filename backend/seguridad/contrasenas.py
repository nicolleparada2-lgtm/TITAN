from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def generar_hash(contrasena: str) -> str:
    return password_hash.hash(contrasena)


def verificar_contrasena(
    contrasena: str,
    contrasena_hash: str
) -> bool:
    return password_hash.verify(
        contrasena,
        contrasena_hash
    )