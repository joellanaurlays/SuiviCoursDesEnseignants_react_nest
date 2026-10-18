import { TypeCloture } from '../../types/enseignement';

/**
 * Badge du mode de clôture d'un enseignement.
 * Affiche uniquement ce qui est utile : une clôture anticipée est signalée
 * explicitement, une clôture normale n'ajoute pas de badge.
 */
export const ClotureBadge = ({ typeCloture }: { typeCloture: TypeCloture | null }) => {
    if (typeCloture === 'ANTICIPEE') {
        return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                Anticipée
            </span>
        );
    }

    if (typeCloture === 'NORMALE') {
        return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                Volume atteint
            </span>
        );
    }

    return <span className="text-xs text-gray-400">—</span>;
};
