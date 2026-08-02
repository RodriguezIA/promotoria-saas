import { z } from "zod";

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Espejo de las reglas requeridas/opcionales de
 * promotoria-api/src/modules/stores/store.schema.ts (createStoreSchema).
 * Mantener ambos en sync si el backend cambia sus reglas.
 */
export const storeAddressFormSchema = z.object({
    id_country: z.number().int().positive("Selecciona un país"),
    id_state: z.number().int().positive("Selecciona un estado"),
    id_city: z.number().int().positive("Selecciona una ciudad"),
    street: z.string().min(1, "La calle es requerida"),
    ext_number: z.string().min(1, "El número exterior es requerido"),
    int_number: z.string().optional(),
    neighborhood: z.string().optional(),
    postal_code: z.string().min(1, "El código postal es requerido"),
    address_references: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export const storeFormSchema = z.object({
    name: z.string().min(1, "El nombre del establecimiento es requerido"),
    store_code: z.string().optional(),
    id_channel_sale: z.number().int().optional(),
    address: storeAddressFormSchema,
});

export type StoreFormValues = z.infer<typeof storeFormSchema>;

export const initialFormData: StoreFormValues = {
    name: "",
    store_code: "",
    id_channel_sale: undefined,
    address: {
        id_country: 0,
        id_state: 0,
        id_city: 0,
        street: "",
        ext_number: "",
        int_number: "",
        neighborhood: "",
        postal_code: "",
        address_references: "",
        latitude: 0,
        longitude: 0,
    }
};

export interface CustomMarkerProps {
    position: google.maps.LatLngLiteral;
    imageUrl: string | null;
    storeName: string;
    onDragEnd?: (lat: number, lng: number) => void;
}

export const libraries: ("places")[] = ["places"];
export const mapContainerStyle = {
    width: "100%",
    height: "700px",
    borderRadius: "8px",
};


