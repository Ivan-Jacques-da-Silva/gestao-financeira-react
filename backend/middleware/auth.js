
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura'

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso requerido' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.usuario = decoded
    next()
  } catch (error) {
    return res.status(403).json({ erro: 'Token inválido' })
  }
}
