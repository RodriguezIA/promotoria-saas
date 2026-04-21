import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Store, MapPin } from "lucide-react"


import { api, ApiResponse } from '@/lib'
import { useAuthStore } from '@/store'
import { Button, Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components'
import { FormData, initialFormData } from './utils'
import { CountryDTO, StateDTO, CityDTO } from '@/dtos'


export default function Establecimiento() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [formData, setFormData] = useState<FormData>(initialFormData)
    const [countries, setCountries] = useState<CountryDTO[]>()
    const [states, setStates] = useState<StateDTO[]>()
    const [cities, setCities] = useState<CityDTO[]>()


    // Use Effect de direccion
    useEffect(() => {
        try {
            const fetchData = async () => {
                const request = await api.get<ApiResponse<CountryDTO[]>>('/clients/countries')
                setCountries(request.data);
            }
            fetchData()
        } catch (error) {
            toast.error("Error al cargar los paises")
        }
    }, []);

    useEffect(() => {
        try {
            const fetchData = async () => {
                const request = await api.get<ApiResponse<CountryDTO[]>>(`/clients/states/${formData.address?.id_country}`)
                setStates(request.data)
            }
            fetchData()
        } catch (error) {
            toast.error("Error al cargar los paises")
        }
    }, [formData.address?.id_country]);

    useEffect(() => {
        try {
            const fetchData = async () => {
                const request = await api.get<ApiResponse<CountryDTO[]>>(`/clients/cities/${formData.address?.id_state}`)
                setCities(request.data)
            }
            fetchData()
        } catch (error) {
            toast.error("Error al cargar los paises")
        }
    }, [formData.address?.id_state]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        formData.id_user = user?.id_user ?? 0;

        try {
            console.log("fomulario: ", formData);
            const res = await api.post<ApiResponse<any>>(`/stores/`, formData);

            console.log("res: ", res);
        } catch (error) {
            console.error("f.handlesubmit: ", error);
        }

    };

    return (
        <>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/establecimientos")}
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {"Nuevo Establecimiento"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {"Completa el formulario para registrar un nuevo establecimiento"}
                    </p>
                </div>
            </div>

            <div className="flex justify-end mb-6 mr-6">
                <Button onClick={handleSubmit}>Guardar</Button>
            </div>

             <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Store size={20} className="text-gray-600" /> <h2 className="text-lg font-medium">Información General</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Establecimiento *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev, name: e.target.value
                                        }))
                                    }}
                                    placeholder="Ej: Sucursal Centro"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="store_code">Código de Tienda *</Label>
                                <Input
                                    id="store_code"
                                    name="store_code"
                                    value={formData.store_code}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev, store_code: e.target.value
                                        }))
                                    }}
                                    placeholder="Ej: SUC-001"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={20} className="text-gray-600" />
                            <h2 className="text-lg font-medium">Dirección</h2>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="country">Pais *</Label>
                                <Select
                                    name="country"
                                    value={formData.address?.id_country ? String(formData.address.id_country) : ""}
                                    onValueChange={(valorSeleccionado) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                id_country: Number(valorSeleccionado)
                                            } : undefined
                                        } as FormData));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un país..." />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {countries?.map((c) => (
                                            <SelectItem value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">Estado *</Label>
                                <Select
                                    name="state"
                                    value={formData.address?.id_state ? String(formData.address.id_state) : ""}
                                    onValueChange={(value) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                id_state: Number(value)
                                            } : undefined
                                        } as FormData));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un estado..." />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {states?.map((s) => (
                                            <SelectItem value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="postal_code">Codigo postal *</Label>
                                <Input
                                    id="postal_code"
                                    name="postal_code"
                                    value={formData.address?.postal_code ?? ""}
                                    placeholder=""
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                postal_code: e.target.value
                                            } : undefined
                                        } as FormData));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">Ciudad *</Label>
                                <Select
                                name="city"
                                    value={formData.address?.id_city ? String(formData.address.id_city) : ""}
                                    onValueChange={(value) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                id_city: Number(value)
                                            } : undefined
                                        } as FormData));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una ciudad..." />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {cities?.map((c) => (
                                            <SelectItem value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="neighborhood">Colonia *</Label>
                                <Input
                                    id="neighborhood"
                                    name="neighborhood"
                                    value={formData.address?.neighborhood ?? ""}
                                    placeholder="Ej: Centro, Polanco, Del Valle..."
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                neighborhood: e.target.value
                                            } : undefined
                                        } as FormData));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="street">Calle *</Label>
                                <Input
                                    id="street"
                                    name="street"
                                    value={formData.address?.street ?? ""}
                                    placeholder=""
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                street: e.target.value
                                            } : undefined
                                        } as FormData));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ext_number">Numero exterior *</Label>
                                <Input
                                    id="ext_number"
                                    name="ext_number"
                                    value={formData.address?.ext_number ?? ""}
                                    placeholder=""
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                ext_number: e.target.value
                                            } : undefined
                                        } as FormData));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="int_number">Numero interior *</Label>
                                <Input
                                    id="int_number"
                                    name="int_number"
                                    value={formData.address?.int_number ?? ""}
                                    placeholder=""
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                int_number: e.target.value
                                            } : undefined
                                        } as FormData));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address_references">Referencias</Label>
                                <Input
                                    type="text"
                                    id="address_references"
                                    name="address_references"
                                    value={formData.address?.address_references ?? ""}
                                    placeholder=""
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: prev.address ? {
                                                ...prev.address,
                                                address_references: e.target.value
                                            } : undefined
                                        } as FormData));
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}