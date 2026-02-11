import { redirect } from 'next/navigation'

/**
 * @deprecated Redirects to /marketplace/sell (new P2P listing flow)
 */
export default function ListProductPage() {
  redirect('/marketplace/sell')
}
