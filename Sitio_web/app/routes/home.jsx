import { useLoaderData } from 'react-router';

import Categorias from '../components/home/Categorias';
import CustomLab from '../components/home/CustomLab';
import Destacadas from '../components/home/Destacadas';
import Diferenciales from '../components/home/Diferenciales';
import Hero from '../components/home/Hero';
import { obtenerCategorias, obtenerProductos } from '../lib/api';
import { useContenido } from '../lib/contenido';
import { jsonLdOrganizacion, meta as construirMeta } from '../lib/seo';

export const meta = ({ matches }) => {
  const general = matches?.[0]?.data?.contenido?.general;
  return construirMeta({
    ruta: '/',
    tagline: general?.tagline,
    imagen: matches?.[0]?.data?.contenido?.home?.hero.image.url,
    descripcion:
      general?.description ??
      'Estatuillas de yeso esculpidas y pintadas a mano en Rosario. Arte pop y clásico para decoración de interiores, con envíos protegidos a todo el país.',
  });
};

async function cargar() {
  const [categorias, destacadas] = await Promise.all([
    obtenerCategorias(),
    obtenerProductos({ destacado: true }),
  ]);
  return { categorias, destacadas };
}

export const loader = () => cargar();
export const clientLoader = () => cargar();

export default function Home() {
  const { categorias, destacadas } = useLoaderData();
  const contenido = useContenido();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganizacion(contenido)) }}
      />
      <Hero />
      <Diferenciales />
      <Destacadas productos={destacadas} />
      <Categorias categorias={categorias} />
      <CustomLab />
    </>
  );
}
