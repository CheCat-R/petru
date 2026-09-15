import { index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.jsx'),
  route('galeria', 'routes/galeria.jsx'),
  route('producto/:slug', 'routes/producto.jsx'),
  route('nosotros', 'routes/nosotros.jsx'),
  route('contacto', 'routes/contacto.jsx'),
  // Legales e informativas
  route('envios', 'routes/envios.jsx'),
  route('cuidados', 'routes/cuidados.jsx'),
  route('devoluciones', 'routes/devoluciones.jsx'),
  route('privacidad', 'routes/privacidad.jsx'),
  route('terminos', 'routes/terminos.jsx'),
  route('arrepentimiento', 'routes/arrepentimiento.jsx'),
  // Rutas de compra: solo en el cliente (no se prerenderizan, no se indexan)
  route('carrito', 'routes/carrito.jsx'),
  route('checkout', 'routes/checkout.jsx'),
  route('pedido/:token', 'routes/pedido.jsx'),
];
