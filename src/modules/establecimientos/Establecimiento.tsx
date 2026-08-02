import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Store, MapPin, Map, Loader2 } from "lucide-react"
import { GoogleMap } from "@react-google-maps/api"


import { api, ApiResponse, useJsApiLoader, GOOGLE_MAPS_CONFIG } from '@/lib'
import { useAuthStore } from '@/stores'
import {
    Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components'
import { storeFormSchema, StoreFormValues, initialFormData } from './utils'
import { CountryDTO, StateDTO, CityDTO, channelSalesDTO, StoreDTO } from '@/dtos'
import { CustomMarker } from './components/CustomMarker'


export default function Establecimiento() {
    const navigate = useNavigate()
    const { id_store } = useParams()
    const { user } = useAuthStore()
    const isEditMode = Boolean(id_store)

    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeFormSchema),
        defaultValues: initialFormData,
    })

    const [countries, setCountries] = useState<CountryDTO[]>()
    const [states, setStates] = useState<StateDTO[]>()
    const [cities, setCities] = useState<CityDTO[]>()
    const [channels, setChannels] = useState<channelSalesDTO[]>()
    const [loadingData, setLoadingData] = useState(isEditMode)

    const [mapCenter, setMapCenter] = useState({ lat: 25.7460, lng: -100.2792 })
    const [markerPosition, setMarkerPosition] = useState<{lat: number, lng: number} | null>(null)

    const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG)

    const idCountry = form.watch("address.id_country")
    const idState = form.watch("address.id_state")
    const name = form.watch("name")
    const idChannelSale = form.watch("id_channel_sale")

    useEffect(() => {
        try {
           const fetchData = async () => {
            const request = await api.get<ApiResponse<channelSalesDTO[]>>('/channel-sales/')
            setChannels(request.data)
           }

           fetchData()
        } catch {
            toast.error("Error al cargar los canales de venta")
        }
    }, [])

    useEffect(() => {
        try {
            const fetchData = async () => {
                const request = await api.get<ApiResponse<CountryDTO[]>>('/clients/countries')
                setCountries(request.data);
            }
            fetchData()
        } catch {
            toast.error("Error al cargar los paises")
        }
    }, []);

    useEffect(() => {
        try {
            const fetchData = async () => {
                const request = await api.get<ApiResponse<CountryDTO[]>>(`/clients/states/${idCountry}`)
                setStates(request.data)
            }
            fetchData()
        } catch {
            toast.error("Error al cargar los paises")
        }
    }, [idCountry]);

    useEffect(() => {
        try {
            const fetchData = async () => {
                const request = await api.get<ApiResponse<CountryDTO[]>>(`/clients/cities/${idState}`)
                setCities(request.data)
            }
            fetchData()
        } catch {
            toast.error("Error al cargar los paises")
        }
    }, [idState]);

    useEffect(() => {
        if (!isEditMode) return;

        let cancelled = false;

        const fetchStore = async () => {
            try {
                setLoadingData(true);
                const res = await api.get<ApiResponse<StoreDTO>>(`/stores/${id_store}`);
                const store = res.data;
                if (cancelled) return;

                form.reset({
                    name: store.name,
                    store_code: store.store_code ?? "",
                    id_channel_sale: store.id_channel_sale,
                    address: {
                        id_country: store.address.id_country ?? 0,
                        id_state: store.address.id_state ?? 0,
                        id_city: store.address.id_city ?? 0,
                        street: store.address.street ?? "",
                        ext_number: store.address.ext_number ?? "",
                        int_number: store.address.int_number ?? "",
                        neighborhood: store.address.neighborhood ?? "",
                        postal_code: store.address.postal_code ?? "",
                        address_references: store.address.address_references ?? "",
                        latitude: Number(store.address.latitude) || 0,
                        longitude: Number(store.address.longitude) || 0,
                    },
                });

                if (store.address.latitude && store.address.longitude) {
                    const pos = { lat: Number(store.address.latitude), lng: Number(store.address.longitude) };
                    setMapCenter(pos);
                    setMarkerPosition(pos);
                }
            } catch (error) {
                console.error("Error al cargar el establecimiento:", error);
                toast.error("Error al cargar el establecimiento");
                navigate("/establecimientos");
            } finally {
                if (!cancelled) setLoadingData(false);
            }
        };

        fetchStore();
        return () => { cancelled = true };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id_store, isEditMode]);

    const onSubmit = async (values: StoreFormValues) => {
        const payload = {
            id_user: user?.id_user ?? 0,
            name: values.name,
            store_code: values.store_code,
            id_channel_sale: values.id_channel_sale,
            address: {
                entity_type: "store",
                entity_id: 0,
                ...values.address,
            },
        };

        try {
            const res = isEditMode
                ? await api.put<ApiResponse<StoreDTO>>(`/stores/${id_store}`, payload)
                : await api.post<ApiResponse<StoreDTO>>(`/stores/`, payload);

            if (res.error && res.error > 0) {
                toast.error(res.message || `Error al ${isEditMode ? "actualizar" : "crear"} el establecimiento`);
                return;
            }

            toast.success(`Establecimiento ${isEditMode ? "actualizado" : "creado"} correctamente`);
            navigate(isEditMode ? `/establecimiento/detalle/${id_store}` : "/establecimientos");
        } catch (error) {
            console.error("f.onSubmit: ", error);
            toast.error(`Error al ${isEditMode ? "actualizar" : "crear"} el establecimiento`);
        }
    };

    const handleLocate = () => {
        if (!isLoaded || !window.google) {
            toast.error("El mapa aún no está listo")
            return
        }

        const address = form.getValues("address")
        const addressParts = []

        if (address?.street) addressParts.push(address.street)
        if (address?.ext_number) addressParts.push(address.ext_number)
        if (address?.neighborhood) addressParts.push(address.neighborhood)

        const cityName = cities?.find(c => c.id === address?.id_city)?.name
        const stateName = states?.find(s => s.id === address?.id_state)?.name
        const countryName = countries?.find(c => c.id === address?.id_country)?.name

        if (cityName) addressParts.push(cityName)
        if (stateName) addressParts.push(stateName)
        if (countryName) addressParts.push(countryName)

        const addressString = addressParts.join(", ")

        if (!addressString || addressParts.length < 2) {
            toast.error("Por favor ingresa más detalles en la dirección para localizarla")
            return
        }

        const geocoder = new window.google.maps.Geocoder()

        geocoder.geocode({ address: addressString }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const location = results[0].geometry.location
                const newPos = { lat: location.lat(), lng: location.lng() }

                setMapCenter(newPos)
                setMarkerPosition(newPos)

                form.setValue("address.latitude", newPos.lat)
                form.setValue("address.longitude", newPos.lng)

                toast.success("Dirección localizada en el mapa")
            } else {
                toast.error("No se pudo encontrar la ubicación exacta. Intenta ser más específico.")
            }
        })
    }

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
            setMarkerPosition(newPos)
            form.setValue("address.latitude", newPos.lat)
            form.setValue("address.longitude", newPos.lng)
        }
    }

    if (loadingData) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 size={32} className="animate-spin text-muted-foreground/70" />
                <p className="text-muted-foreground">Cargando establecimiento...</p>
            </div>
        );
    }

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
                    <h1 className="text-2xl font-semibold text-foreground">
                        {isEditMode ? "Editar Establecimiento" : "Nuevo Establecimiento"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isEditMode
                            ? "Modifica los datos del establecimiento"
                            : "Completa el formulario para registrar un nuevo establecimiento"}
                    </p>
                </div>
            </div>

            <div className="flex justify-end mb-6 mr-6">
                <Button type="submit" form="establecimiento-form" disabled={form.formState.isSubmitting}>
                    {isEditMode ? "Guardar cambios" : "Guardar"}
                </Button>
            </div>

            <Form {...form}>
                <form id="establecimiento-form" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="bg-white rounded-lg border border-border p-6">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Store size={20} className="text-muted-foreground" /> <h2 className="text-lg font-medium">Información General</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Establecimiento *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Sucursal Centro" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="store_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Código de Tienda (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: SUC-001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="id_channel_sale"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Canal de Venta (Opcional)</FormLabel>
                                            <Select
                                                value={field.value ? String(field.value) : undefined}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un canal de venta..." />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {channels?.map((channel) => (
                                                        <SelectItem key={channel.id} value={String(channel.id)}>
                                                            <div className="flex items-center gap-2">
                                                                {channel.url_image && (
                                                                    <img
                                                                        src={channel.url_image}
                                                                        alt={channel.name}
                                                                        className="w-8 h-8 object-contain rounded-full bg-white border border-border"
                                                                    />
                                                                )}
                                                                <span className="capitalize">{channel.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin size={20} className="text-muted-foreground" />
                                <h2 className="text-lg font-medium">Dirección</h2>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address.id_country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pais *</FormLabel>
                                            <Select
                                                value={field.value ? String(field.value) : ""}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un país..." />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {countries?.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address.id_state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado *</FormLabel>
                                            <Select
                                                value={field.value ? String(field.value) : ""}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un estado..." />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {states?.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address.postal_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Codigo postal *</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address.id_city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ciudad *</FormLabel>
                                            <Select
                                                value={field.value ? String(field.value) : ""}
                                                onValueChange={(value) => field.onChange(Number(value))}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona una ciudad..." />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {cities?.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address.neighborhood"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Colonia (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Centro, Polanco, Del Valle..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address.street"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Calle *</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address.ext_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Numero exterior *</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address.int_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Numero interior (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address.address_references"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Referencias (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2 flex flex-col gap-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleLocate}
                                        className="w-full md:w-auto self-start flex items-center gap-2"
                                    >
                                        <Map size={18} />
                                        Localizar en el mapa
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-right">
                                        * Puedes hacer clic en el mapa para ajustar la ubicación exacta del establecimiento.
                                    </p>

                                    <div className="h-[400px] w-full rounded-md border border-border overflow-hidden bg-muted/50 relative">
                                        {isLoaded ? (
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                center={mapCenter}
                                                zoom={markerPosition ? 17 : 13}
                                                onClick={onMapClick}
                                                options={{
                                                    disableDefaultUI: true,
                                                    zoomControl: true,
                                                    streetViewControl: false,
                                                    mapTypeControl: false,
                                                }}
                                            >
                                                {markerPosition && (
                                                    <CustomMarker
                                                        position={markerPosition}
                                                        storeName={name || "Nuevo Establecimiento"}
                                                        imageUrl={channels?.find(c => c.id === idChannelSale)?.url_image || ''}
                                                    />
                                                )}
                                            </GoogleMap>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                                Cargando mapa de Google...
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </>
    );
}
