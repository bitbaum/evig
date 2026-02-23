interface Props {
  postalCode: string
  city: string
  canton: string
  onPostalCodeChange: (value: string) => void
  onCityChange: (value: string) => void
  onCantonChange: (value: string) => void
}

export function LocationSection({
  postalCode,
  city,
  canton,
  onPostalCodeChange,
  onCityChange,
  onCantonChange,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Wo bist du?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PLZ
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="8001"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stadt
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Stadt"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kanton
          </label>
          <input
            type="text"
            value={canton}
            onChange={(e) => onCantonChange(e.target.value)}
            placeholder="Kanton"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  )
}
