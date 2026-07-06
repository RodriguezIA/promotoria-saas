import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { PromoterBankAccountDTO, CreateBankAccountDTO } from "@/dtos"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from "@/components"
import { createBankAccount, updateBankAccount } from "@/Fetch/promotores"

interface BankAccountModalProps {
  open: boolean
  onClose: () => void
  idPromoter: number
  account?: PromoterBankAccountDTO | null
  onSuccess: () => void
}

export function BankAccountModal({ open, onClose, idPromoter, account, onSuccess }: BankAccountModalProps) {
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<'CLABE' | 'CARD'>("CLABE")
  const [accountHolder, setAccountHolder] = useState("")
  const [clabe, setClabe] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [bankName, setBankName] = useState("")

  useEffect(() => {
    if (account) {
      setAccountType(account.account_type)
      setAccountHolder(account.account_holder_name)
      setClabe(account.clabe || "")
      setCardNumber(account.card_number || "")
      setBankName(account.bank_name)
    } else {
      resetForm()
    }
  }, [account, open])

  const resetForm = () => {
    setAccountType("CLABE")
    setAccountHolder("")
    setClabe("")
    setCardNumber("")
    setBankName("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSave = async () => {
    if (!accountHolder.trim()) {
      toast.error("Ingresa el nombre del titular")
      return
    }
    if (!bankName.trim()) {
      toast.error("Selecciona el banco")
      return
    }
    if (accountType === "CLABE") {
      if (!clabe.trim() || clabe.length !== 18 || !/^\d+$/.test(clabe)) {
        toast.error("Ingresa un CLABE válido (18 dígitos)")
        return
      }
    } else {
      if (!cardNumber.trim() || cardNumber.length < 15 || cardNumber.length > 19) {
        toast.error("Ingresa un número de tarjeta válido")
        return
      }
    }

    setLoading(true)
    try {
      const payload: CreateBankAccountDTO = {
        account_holder_name: accountHolder,
        account_type: accountType,
        clabe: accountType === "CLABE" ? clabe : undefined,
        card_number: accountType === "CARD" ? cardNumber : undefined,
        bank_name: bankName,
      }

      if (account) {
        await updateBankAccount(idPromoter, account.id, payload)
        toast.success("Cuenta actualizada correctamente")
      } else {
        await createBankAccount(idPromoter, payload)
        toast.success("Cuenta creada correctamente")
      }

      onSuccess()
      handleClose()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {account ? "Editar cuenta bancaria" : "Agregar cuenta bancaria"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="holder" className="text-sm font-medium">
              Nombre del titular *
            </Label>
            <Input
              id="holder"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Juan Pérez"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="type" className="text-sm font-medium">
              Tipo de cuenta *
            </Label>
            <Select value={accountType} onValueChange={(v) => setAccountType(v as 'CLABE' | 'CARD')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLABE">CLABE (18 dígitos)</SelectItem>
                <SelectItem value="CARD">Tarjeta (15-19 dígitos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accountType === "CLABE" ? (
            <div>
              <Label htmlFor="clabe" className="text-sm font-medium">
                CLABE *
              </Label>
              <Input
                id="clabe"
                value={clabe}
                onChange={(e) => setClabe(e.target.value.replace(/\D/g, "").slice(0, 18))}
                placeholder="000000000000000000"
                maxLength={18}
                className="mt-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {clabe.length}/18 dígitos
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="card" className="text-sm font-medium">
                Número de tarjeta *
              </Label>
              <Input
                id="card"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))}
                placeholder="1234567890123456"
                maxLength={19}
                className="mt-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {cardNumber.length}/15-19 dígitos
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="bank" className="text-sm font-medium">
              Banco *
            </Label>
            <Input
              id="bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ej: BBVA, Santander, etc."
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
