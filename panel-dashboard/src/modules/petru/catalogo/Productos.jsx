/**
 * Catálogo de Pëtru, contra Laravel.
 *
 * Reemplaza a `modules/productos/Productos.jsx` (el del ERP, sobre mocks). La
 * paginación y la búsqueda son del servidor: la tabla muestra lo que llegó y
 * delega el orden, como pide `DataTable` cuando la paginación es externa.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import PageHeader from "../../../components/PageHeader/PageHeader";
import Button from "../../../components/Button/Button";
import DataTable from "../../../components/DataTable/DataTable";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import Toolbar from "../../../components/Toolbar/Toolbar";
import Modal from "../../../components/Modal/Modal";
import { useToast } from "../../../components/Toast/ToastContext";

import { claves, eliminarProducto, formatearPrecio, listarProductos } from "../api/petruApi";
import { ESTADOS_PRODUCTO } from "../lib/estados";

const Productos = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(25);
  const [aEliminar, setAEliminar] = useState(null);

  const params = { buscar, estado, page: pagina + 1, por_pagina: porPagina };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: claves.productos(params),
    queryFn: () => listarProductos(params),
    placeholderData: (previo) => previo,
  });

  const eliminar = useMutation({
    mutationFn: (id) => eliminarProducto(id),
    onSuccess: () => {
      showToast("Producto eliminado", "success");
      queryClient.invalidateQueries({ queryKey: ["petru", "productos"] });
      queryClient.invalidateQueries({ queryKey: claves.categorias });
    },
    onError: (e) => showToast(e.message, "error"),
    onSettled: () => setAEliminar(null),
  });

  const filas = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns = [
    {
      field: "name",
      headerName: "Producto",
      renderCell: (row) => (
        <Box className="producto-cell" sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            variant="rounded"
            src={row.image?.url ? absoluta(row.image.url) : undefined}
            sx={{ width: 40, height: 40, bgcolor: "var(--bg-sunken)", color: "var(--text-secondary)", fontWeight: 700 }}
          >
            {row.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
            <Typography variant="caption" color="text.secondary" className="mono">{row.sku}</Typography>
          </Box>
        </Box>
      ),
    },
    { field: "categoryName", headerName: "Categoría", renderCell: (row) => row.category?.name ?? "—" },
    { field: "price", headerName: "Precio", align: "right", renderCell: (row) => formatearPrecio(row.price) },
    { field: "stock", headerName: "Stock", align: "right" },
    { field: "status", headerName: "Estado", renderCell: (row) => <StatusBadge status={row.status} /> },
    {
      field: "featured",
      headerName: "Destacada",
      renderCell: (row) => (row.featured ? <StatusBadge status="Sí" tone="info" showDot={false} /> : "—"),
    },
    {
      field: "acciones",
      headerName: "",
      align: "right",
      sortable: false,
      renderCell: (row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => navigate(`/productos/${row.id}`)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={() => setAEliminar(row)}>
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Productos"
        subtitle={`${total} ${total === 1 ? "pieza" : "piezas"} en el catálogo`}
        actions={
          <Button variant="primary" startIcon={<AddIcon />} onClick={() => navigate("/productos/nuevo")}>
            Nuevo producto
          </Button>
        }
      />

      <Toolbar
        searchValue={buscar}
        onSearchChange={(v) => { setBuscar(v); setPagina(0); }}
        searchPlaceholder="Buscar por nombre o SKU…"
        filterValue={estado}
        onFilterChange={(v) => { setEstado(v); setPagina(0); }}
        filterOptions={[{ label: "Todos los estados", value: "" }, ...ESTADOS_PRODUCTO.map((e) => ({ label: e, value: e }))]}
      />

      <DataTable
        columns={columns}
        data={filas}
        loading={isLoading || isFetching}
        onRowClick={(row) => navigate(`/productos/${row.id}`)}
        emptyState={{
          icon: <Inventory2OutlinedIcon />,
          title: buscar || estado ? "Ninguna pieza coincide" : "Todavía no hay productos",
          description: buscar || estado ? "Probá con otra búsqueda o sacá el filtro." : "Cargá la primera pieza del catálogo.",
          action: !buscar && !estado ? (
            <Button variant="primary" startIcon={<AddIcon />} onClick={() => navigate("/productos/nuevo")}>
              Nuevo producto
            </Button>
          ) : null,
        }}
        pagination={{
          page: pagina,
          rowsPerPage: porPagina,
          totalCount: total,
          onPageChange: (_, p) => setPagina(p),
          onRowsPerPageChange: (e) => { setPorPagina(Number(e.target.value)); setPagina(0); },
        }}
      />

      <Modal
        open={Boolean(aEliminar)}
        onClose={() => setAEliminar(null)}
        title="Eliminar producto"
        subtitle={aEliminar?.name}
        actions={
          <>
            <Button variant="ghost" onClick={() => setAEliminar(null)}>Cancelar</Button>
            <Button variant="danger-solid" disabled={eliminar.isPending} onClick={() => eliminar.mutate(aEliminar.id)}>
              {eliminar.isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </>
        }
      >
        <Typography variant="body2">
          La pieza desaparece del sitio y del catálogo. Los pedidos que ya la incluyen conservan su copia
          del nombre y el precio. Esta acción no se puede deshacer.
        </Typography>
      </Modal>
    </Box>
  );
};

/** Las imágenes del seed son rutas del sitio (`/img/...`); las subidas ya vienen absolutas. */
const absoluta = (url) => (url.startsWith("http") ? url : `${import.meta.env.VITE_SITIO_URL ?? "http://localhost:5173"}${url}`);

export default Productos;
