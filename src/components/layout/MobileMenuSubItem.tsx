import { NavigationItem } from "@/config/navigation";

interface MobileMenuSubItemProps {
    subItem: NavigationItem;
    onClose: () => void;
    handleNavigation: (href: string) => void;
}

export function MobileMenuSubItem({ subItem, onClose, handleNavigation }: MobileMenuSubItemProps) {
    if (subItem.isSection) {
        return (
            <div className="mt-4 pt-2 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">
                    {subItem.name}
                </div>
            </div>
        )
    }

    if (subItem.href === '#') {
        return (
            <div
                className="block w-full text-left rounded-lg px-3 py-2 text-sm leading-6 text-gray-400 cursor-not-allowed"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold">{subItem.name}</div>
                        {subItem.description && <div className="text-xs text-gray-400">{subItem.description}</div>}
                    </div>
                    {subItem.badge && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {subItem.badge}
                        </span>
                    )}
                </div>
            </div>
        )
    }

    if (subItem.external) {
        return (
            <a
                href={subItem.href}
                className="block w-full text-left rounded-lg px-3 py-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
            >
                <div className="font-semibold">{subItem.name}</div>
                {subItem.description && <div className="text-xs text-gray-500">{subItem.description}</div>}
            </a>
        )
    }

    return (
        <button
            type="button"
            className="block w-full text-left rounded-lg px-3 py-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 hover:text-green-600 transition-colors duration-200"
            onClick={() => handleNavigation(subItem.href)}
        >
            <div className="font-semibold">{subItem.name}</div>
            {subItem.description && <div className="text-xs text-gray-500">{subItem.description}</div>}
        </button>
    )
} 