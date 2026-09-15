/** Bandeja del formulario de contacto del sitio. */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

import PageHeader from "../../../components/PageHeader/PageHeader";
import Button from "../../../components/Button/Button";
import DataTable from "../../../components/DataTable/DataTable";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import Toolbar from "../../../components/Toolbar/Toolbar";
import Modal from "../../../components/Modal/Modal";
import { useToast } from "../../../components/Toast/ToastContext";

import { cambiarEstadoConsulta, claves, formatearFecha, listarConsultas } from "../api/petruApi";
import { ESTADOS_CONSULTA, MOTIVOS_CONSULTA } from "../lib/estados";

const tono = { nueva: "warning", leida: "info", respondida: "success" };
const soloDigitos = (tel) => (tel ?? "").replace(/\D/g, "");

const Consultas = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(0);
  const [abierta, setAbierta] = useState(null);

  const params = { estado, page: pagina + 1, por_pagina: 25 };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: claves.consultas(params),
    queryFn: () => listarConsultas(params),
    placeholderData: (previo) => previo,
  });

  const cambiar = useMutation({
    mutationFn: ({ id, estado: e }) => cambiarEstadoConsulta(id, e),
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ["petru", "consultas"] });
      setAbierta((a) => (a && a.id === c.id ? c : a));
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const abrir = (c) => {
    setAbierta(c);
    if (c.status === "nueva") cambiar.mutate({ id: c.id, estado: "leida" });
  };

  const filas = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns = [
    { field: "createdAt", headerName: "Fecha", renderCell: (row) => formatearFecha(row.createdAt) },
    {
      field: "name", headerName: "Quién",
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={row.status === "nueva" ? 700 : 500}>{row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.email ?? row.phone ?? "—"}</Typography>
        </Box>
      ),
    },
    { field: "reason", headerName: "Motivo", renderCell: (row) => MOTIVOS_CONSULTA[row.reason] ?? row.reason },
    {
      field: "message", headerName: "Mensaje",
      renderCell: (row) => (
        <Typography variant="body2" sx={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.message}
        </Typography>
      ),
    },
    { field: "status", headerName: "Estado", renderCell: (row) => <StatusBadge status={ESTADOS_CONSULTA[row.status]} tone={tono[row.status]} /> },
  ];

  return (
    <Box>
      <PageHeader title="Consultas" subtitle="Lo que llega por el formulario de contacto del sitio" />

      <Toolbar
        filterValue={estado}
        onFilterChange={(v) => { setEstado(v); setPagina(0); }}
        filterOptions={[{ label: "Todas", value: "" }, ...Object.entries(ESTADOS_CONSULTA).map(([value, label]) => ({ label, value }))]}
      />

      <DataTable
        columns={columns}
        data={filas}
        loading={isLoading || isFetching}
        onRowClick={abrir}
        emptyState={{ icon: <ForumOutlinedIcon />, title: "Sin consultas", description: "Cuando alguien escriba desde el sitio, aparece acá." }}
        pagination={{ page: pagina, rowsPerPage: 25, totalCount: total, onPageChange: (_, p) => setPagina(p), onRowsPerPageChange: () => {} }}
      />

      <Modal
        open={Boolean(abierta)}
        onClose={() => setAbierta(null)}
        title={abierta?.name}
        subtitle={abierta ? `${MOTIVOS_CONSULTA[abierta.reason] ?? abierta.reason} · ${formatearFecha(abierta.createdAt)}` : ""}
        actions={
          abierta && (
            <>
              {abierta.phone && (
                <Button variant="secondary" startIcon={<WhatsAppIcon />} onClick={() => window.open(`https://wa.me/${soloDigitos(abierta.phone)}`, "_blank", "noopener")}>
                  WhatsApp
                </Button>
              )}
              {abierta.email && (
                <Button variant="secondary" startIcon={<EmailOutlinedIcon />} onClick={() => window.open(`mailto:${abierta.email}`)}>
                  Email
                </Button>
              )}
              <Button
                variant="primary"
                disabled={abierta.status === "respondida" || cambiar.isPending}
                onClick={() => cambiar.mutate({ id: abierta.id, estado: "respondida" })}
              >
                {abierta.status === "respondida" ? "Respondida" : "Marcar respondida"}
              </Button>
            </>
          )
        }
      >
        {abierta && (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {abierta.email && <Typography variant="body2"><strong>Email:</strong> {abierta.email}</Typography>}
              {abierta.phone && <Typography variant="body2"><strong>Tel:</strong> {abierta.phone}</Typography>}
            </Box>
            <Divider />
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{abierta.message}</Typography>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

export default Consultas;
