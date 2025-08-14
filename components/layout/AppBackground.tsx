import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

const AppBackground: React.FC = () => {
    const { userProfile } = useAppContext();

    if (!userProfile?.backgroundImage) {
        // Render default solid background if no image is set
        return <div className="fixed inset-0 -z-20 bg-bg-main" />;
    }

    return (
        <>
            <div
                className="fixed inset-0 -z-20 bg-cover bg-center transition-all duration-500"
                style={{ backgroundImage: `url(${userProfile.backgroundImage})` }}
            />
            <div className="fixed inset-0 -z-10 bg-bg-main/70 backdrop-blur-sm" />
        </>
    );
};

export default AppBackground;