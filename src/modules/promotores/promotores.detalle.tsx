import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Edit2, Trash, Plus, User } from "lucide-react";

import { api, ApiResponse } from '@/lib'
import { PromoterDTO, PromoterBankAccountDTO } from "@/dtos"; 
import { UploadImageModal, BankAccountModal } from "./components";
import { getPromoterById, getBankAccounts, deleteBankAccount } from "@/Fetch/promotores"; 
import { Button, Card, Separator, DataTable, PageWrapper, ConfirmModal, Avatar } from "@/components";  

export function PromoterDetalle() { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 
  const idPromoter = Number(id);

  const [promoter, setPromoter] = useState<PromoterDTO | null>(null); 
  const [bankAccounts, setBankAccounts] = useState<PromoterBankAccountDTO[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [loadingAccounts, setLoadingAccounts] = useState(false); 
  const [uploadImageOpen, setUploadImageOpen] = useState(false); 
  const [bankAccountModalOpen, setBankAccountModalOpen] = useState(false); 
  const [selectedAccount, setSelectedAccount] = useState<PromoterBankAccountDTO | null>(null); 
  const [accountToDelete, setAccountToDelete] = useState<PromoterBankAccountDTO | null>(null); 
  const [deletingAccount, setDeletingAccount] = useState(false); 
  
  useEffect(() => { 
    const fetchDatos = async () => {

      if (!idPromoter) return;

      setLoading(true);

      try {
        const res = await api.get<ApiResponse<PromoterDTO>>(`/promoters/${idPromoter}`);
        if (res.ok && res.data) setPromoter(res.data); 
        else toast.error("Promotor no encontrado"); 
      } catch (error) { 
        console.error("Error:", error); 
        toast.error("Error al cargar datos"); 
      } finally { 
        setLoading(false); 
      } 
    };

    fetchDatos(); 
  }, [idPromoter]); 
  
  useEffect(() => { 
    const fetchAccounts = async () => { 
      if (!idPromoter) return; 
      setLoadingAccounts(true); 
      try { 
        const res = await getBankAccounts(idPromoter); 
        if (res.ok && res.data) setBankAccounts(res.data); 
      } catch (error) { 
        console.error("Error:", error); 
      } finally { 
        setLoadingAccounts(false); 
      } 
    }; 
    fetchAccounts(); 
  }, [idPromoter]); 
  
  const handleDeleteAccount = async () => { 
    if (!accountToDelete) return; 
    setDeletingAccount(true); 
    try { 
      await deleteBankAccount(idPromoter, accountToDelete.id); 
      toast.success("Cuenta eliminada"); 
      setBankAccounts(prev => prev.filter(a => a.id !== accountToDelete.id)); 
      setAccountToDelete(null); 
    } catch (error: any) { 
      toast.error(error.message || "Error"); 
    } finally { 
      setDeletingAccount(false); 
    } 
  }; 
  
  const handleUploadImageSuccess = (imageUrl: string) => { 
    setPromoter(prev => prev ? { ...prev, vc_image: imageUrl } : null); 
  }; 
  
  const handleBankAccountSuccess = () => { 
    const fetchAccounts = async () => { 
      try { 
        const res = await getBankAccounts(idPromoter); 
        if (res.ok && res.data) setBankAccounts(res.data); 
      } catch (error) { 
        console.error("Error:", error); 
      } 
    }; 
    fetchAccounts(); 
    setSelectedAccount(null); 
    setBankAccountModalOpen(false); 
  }; 
  
  if (loading) return (<PageWrapper><div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-info" /><p className="text-muted-foreground">Cargando...</p></div></PageWrapper>); 
  
  if (!promoter) return (<PageWrapper><div className="p-8 text-center rounded-lg border"><h2 className="text-xl font-bold mb-4">No encontrado</h2><Button onClick={() => navigate("/promotores")}>Volver</Button></div></PageWrapper>); 
  
  const columns: ColumnDef<PromoterBankAccountDTO>[] = [{ accessorKey: "account_holder_name", header: "Titular", cell: ({ row }) => <span className="font-medium">{row.original.account_holder_name}</span> }, { accessorKey: "account_type", header: "Tipo", cell: ({ row }) => <span className="text-xs font-semibold">{row.original.account_type}</span> }, { accessorKey: "bank_name", header: "Banco", cell: ({ row }) => <span>{row.original.bank_name}</span> }, { id: "actions", header: "Acciones", cell: ({ row }) => (<div className="flex gap-2"><button onClick={() => { setSelectedAccount(row.original); setBankAccountModalOpen(true); }} className="p-1 hover:bg-muted rounded"><Edit2 size={14} /></button><button onClick={() => setAccountToDelete(row.original)} className="p-1 text-destructive"><Trash size={14} /></button></div>) }]; 
  
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-6 mb-8">

          <div className="flex flex-col items-center">
            <Avatar size="xl" src={promoter.vc_image || undefined} alt={promoter.name} fallback={<User size={40} />} />
            <Button variant="outline" size="sm" onClick={() => setUploadImageOpen(true)} className="mt-3 gap-2">
              <Plus size={14} /> Cambiar foto
            </Button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{promoter.name} {promoter.lastname}</h1>
            <p className="text-muted-foreground">ID: #{promoter.id}</p>
            
            {promoter.email && <p className="text-sm mt-2"><strong>Email:</strong> {promoter.email}</p>}
            {promoter.phone && <p className="text-sm"><strong>Tel:</strong> {promoter.phone}</p>}
            <p className="text-sm"><strong>Estado:</strong> {promoter.isActive ? "Activo" : "Inactivo"}</p>
            
            <Button variant="outline" className="mt-6" onClick={() => navigate("/promotores")}>Volver</Button>  
          </div>  
        </div>
        
        <Separator className="my-8" />
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Cuentas Bancarias</h2>
            <Button size="sm" onClick={() => { setSelectedAccount(null); setBankAccountModalOpen(true); }} className="gap-2">
              <Plus size={14} /> Agregar
            </Button>
          </div>
          
          <Card className="overflow-hidden">
            <DataTable columns={columns} data={bankAccounts} isLoading={loadingAccounts} emptyMessage="Sin cuentas" pagination={{ showPageSizeSelector: false, showPageNavigation: false, showSelectedCount: false, pageSize: 10 }} responsive={{ enabled: true }} />
          </Card>
        </div>
      </div>

      {/* Modal Upload de Imagen */}
      <UploadImageModal
        open={uploadImageOpen}
        onClose={() => setUploadImageOpen(false)}
        idPromoter={idPromoter}
        onSuccess={handleUploadImageSuccess}
      />

      {/* Modal de Cuentas Bancarias */}
      <BankAccountModal
        open={bankAccountModalOpen}
        onClose={() => {
          setBankAccountModalOpen(false)
          setSelectedAccount(null)
        }}
        idPromoter={idPromoter}
        account={selectedAccount}
        onSuccess={handleBankAccountSuccess}
      />

      {/* Modal de Confirmación Eliminar Cuenta */}
      <ConfirmModal
        open={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleDeleteAccount}
        loading={deletingAccount}
        variant="danger"
        title="¿Eliminar cuenta bancaria?"
        description={`Se eliminará la cuenta de ${accountToDelete?.account_holder_name}`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
      />
    </PageWrapper>
  ); 
}
