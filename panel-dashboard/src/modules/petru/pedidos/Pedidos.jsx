import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";

import PageHeader from "../../../components/PageHeader/PageHeader";
import DataTable from "../../../components/DataTable/DataTable";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import Toolbar from "../../../components/Toolbar/Toolbar";

import { claves, formatearFecha, formatearPrecio, listarPedidos } from "../api/petruApi";
import { ESTADOS_PAGO } from "../lib/estados";

const Pedidos = () => {
  const navigate = useNavigate();
  const [buscar, setBuscar] = useState("");
  const [estadoPago, setEstadoPago] = useState("");
  const [pagina, setPagina] = useState(0);

  const params = { buscar, estado_pago: estadoPago, page: pagina + 1, por_pagina: 25 };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: claves.pedidos(params),
    queryFn: () => listarPedidos(params),
    placeholderData: (previo) => previo,
  });

  const filas = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns = [
    { field: "id", headerName: "Pedido", renderCell: (row) => <span className="mono">#{row.id}</span> },
    { field: "createdAt", headerName: "Fecha", renderCell: (row) => formatearFecha(row.createdAt) },
    {
      field: "customerName", headerName: "Cliente",
      renderCell: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.customerName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.customerEmail}</Typography>
        </Box>
      ),
    },
    { field: "items", headerName: "Piezas", align: "right", sortable: false, renderCell: (row) => row.items?.reduce((n, i) => n + i.qty, 0) ?? "—" },
    { field: "total", headerName: "Total", align: "right", renderCell: (row) => formatearPrecio(row.total) },
    { field: "paymentStatus", headerName: "Pago", renderCell: (row) => <StatusBadge status={row.paymentStatus} /> },
    { field: "fulfillmentStatus", headerName: "Envío", renderCell: (row) => <StatusBadge status={row.fulfillmentStatus} /> },
  ];

  return (
    <Box>
      <PageHeader title="Pedidos" subtitle={`${total} ${total === 1 ? "pedido" : "pedidos"} de la tienda`} />

      <Toolbar
        searchValue={buscar}
        onSearchChange={(v) => { setBuscar(v); setPagina(0); }}
        searchPlaceholder="Buscar por número, nombre o email…"
        filterValue={estadoPago}
        onFilterChange={(v) => { setEstadoPago(v); setPagina(0); }}
        filterOptions={[{ label: "Todos los estados de pago", value: "" }, ...ESTADOS_PAGO.map((e) => ({ label: e, value: e }))]}
      />

      <DataTable
        columns={columns}
        data={filas}
        loading={isLoading || isFetching}
        onRowClick={(row) => navigate(`/pedidos/${row.id}`)}
        emptyState={{
          icon: <ShoppingBagOutlinedIcon />,
          title: buscar || estadoPago ? "Ningún pedido coincide" : "Todavía no hay pedidos",
          description: buscar || estadoPago ? "Probá con otra búsqueda o sacá el filtro." : "Cuando alguien compre en el sitio, aparece acá.",
        }}
        pagination={{ page: pagina, rowsPerPage: 25, totalCount: total, onPageChange: (_, p) => setPagina(p), onRowsPerPageChange: () => {} }}
      />
    </Box>
  );
};

export default Pedidos;
