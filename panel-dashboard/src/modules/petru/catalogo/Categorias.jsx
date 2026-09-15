import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";

import PageHeader from "../../../components/PageHeader/PageHeader";
import Button from "../../../components/Button/Button";
import DataTable from "../../../components/DataTable/DataTable";
import Modal from "../../../components/Modal/Modal";
import InputField from "../../../components/Form/InputField/InputField";
import { useToast } from "../../../components/Toast/ToastContext";
import { ApiError } from "../../../lib/apiClient";

import { actualizarCategoria, claves, crearCategoria, eliminarCategoria, listarCategorias } from "../api/petruApi";

const VACIA = { nombre: "", slug: "", descripcion: "", orden: 0 };

const Categorias = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [editando, setEditando] = useState(null); // null | VACIA | categoría
  const [aEliminar, setAEliminar] = useState(null);
  const [errores, setErrores] = useState({});

  const { data: categorias = [], isLoading } = useQuery({ queryKey: claves.categorias, queryFn: listarCategorias });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: claves.categorias });

  const guardar = useMutation({
    mutationFn: (c) => (c.id ? actualizarCategoria(c.id, c) : crearCategoria(c)),
    onSuccess: (_, c) => {
      invalidar();
      setEditando(null);
      setErrores({});
      showToast(c.id ? "Categoría actualizada" : "Categoría creada", "success");
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 422) setErrores(e.errors);
      else showToast(e.message, "error");
    },
  });

  const eliminar = useMutation({
    mutationFn: (id) => eliminarCategoria(id),
    onSuccess: () => { invalidar(); showToast("Categoría eliminada", "success"); },
    onError: (e) => showToast(e.message, "error"),
    onSettled: () => setAEliminar(null),
  });

  const abrir = (c) => {
    setErrores({});
    setEditando(c ? { id: c.id, nombre: c.name, slug: c.slug, descripcion: c.description ?? "", orden: c.order ?? 0 } : { ...VACIA });
  };

  const set = (campo) => (e) => setEditando((c) => ({ ...c, [campo]: e.target.value }));
  const err = (campo) => errores[campo]?.[0];

  const columns = [
    { field: "name", headerName: "Categoría", renderCell: (row) => <Typography variant="body2" fontWeight={600}>{row.name}</Typography> },
    { field: "slug", headerName: "Slug", renderCell: (row) => <span className="mono">{row.slug}</span> },
    { field: "description", headerName: "Descripción", renderCell: (row) => row.description ?? "—" },
    { field: "productCount", headerName: "Piezas", align: "right" },
    { field: "order", headerName: "Orden", align: "right" },
    {
      field: "acciones", headerName: "", align: "right", sortable: false,
      renderCell: (row) => (
        <Box onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Editar"><IconButton size="small" onClick={() => abrir(row)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={row.productCount > 0 ? "Tiene piezas asignadas" : "Eliminar"}>
            <span>
              <IconButton size="small" disabled={row.productCount > 0} onClick={() => setAEliminar(row)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Categorías"
        subtitle="Cómo se agrupan las piezas en la galería del sitio"
        actions={<Button variant="primary" startIcon={<AddIcon />} onClick={() => abrir(null)}>Nueva categoría</Button>}
      />

      <DataTable
        columns={columns}
        data={categorias}
        loading={isLoading}
        onRowClick={abrir}
        emptyState={{ icon: <CategoryOutlinedIcon />, title: "Sin categorías", description: "Creá la primera para poder agrupar el catálogo." }}
      />

      <Modal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title={editando?.id ? "Editar categoría" : "Nueva categoría"}
        actions={
          <>
            <Button variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button variant="primary" disabled={guardar.isPending} onClick={() => guardar.mutate({ ...editando, slug: editando.slug || null })}>
              {guardar.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </>
        }
      >
        {editando && (
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={12}><InputField label="Nombre" value={editando.nombre} onChange={set("nombre")} required autoFocus error={!!err("nombre")} helperText={err("nombre")} /></Grid>
            <Grid size={{ xs: 8 }}><InputField label="Slug (URL)" value={editando.slug} onChange={set("slug")} error={!!err("slug")} helperText={err("slug") ?? "Vacío = se genera del nombre"} /></Grid>
            <Grid size={{ xs: 4 }}><InputField label="Orden" type="number" value={editando.orden} onChange={set("orden")} error={!!err("orden")} helperText={err("orden")} /></Grid>
            <Grid size={12}><InputField label="Descripción" value={editando.descripcion} onChange={set("descripcion")} multiline minRows={2} error={!!err("descripcion")} helperText={err("descripcion") ?? "Se muestra en la tarjeta del home"} /></Grid>
          </Grid>
        )}
      </Modal>

      <Modal
        open={Boolean(aEliminar)}
        onClose={() => setAEliminar(null)}
        title="Eliminar categoría"
        subtitle={aEliminar?.name}
        actions={
          <>
            <Button variant="ghost" onClick={() => setAEliminar(null)}>Cancelar</Button>
            <Button variant="danger-solid" disabled={eliminar.isPending} onClick={() => eliminar.mutate(aEliminar.id)}>Eliminar</Button>
          </>
        }
      >
        <Typography variant="body2">Esta categoría no tiene piezas asignadas. Se elimina de forma definitiva.</Typography>
      </Modal>
    </Box>
  );
};

export default Categorias;
