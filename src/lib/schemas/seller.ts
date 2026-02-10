import { z } from 'zod'
import { swissPostalCodeSchema, phoneSchema } from './common'

export const SellerApplicationSchema = z.object({
  businessName: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  postalCode: swissPostalCodeSchema,
  phone: phoneSchema,
  experience: z.string().optional().nullable(),
  productTypes: z.array(z.string()).min(1, 'Mindestens ein Produkttyp ist erforderlich'),
  motivation: z.string().optional().nullable(),
  termsAccepted: z.literal(true, { error: 'AGB müssen akzeptiert werden' }),
})

export type SellerApplicationInput = z.infer<typeof SellerApplicationSchema>
