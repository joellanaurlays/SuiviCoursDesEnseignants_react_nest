// import React from 'react';

export const EtatBadge = ({ etat }: { etat: string }) => {
    let color = 'bg-gray-100 text-gray-800';
    let label = 'Non commencé';

    if (etat === 'EN_COURS') {
        color = 'bg-yellow-100 text-yellow-800';
        label = 'En cours';
    } else if (etat === 'TERMINE') {
        color = 'bg-green-100 text-green-800';
        label = 'Terminé';
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
            {label}
        </span>
    );
};
