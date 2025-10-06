import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    let token = req.header('Authorization');

    if (!token) {
      return res.status(403).json({ message: 'Access Denied' });
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = verified.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};