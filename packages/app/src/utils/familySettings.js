// Managed account capabilities are independent of editable or synced UI preferences.
export const familySettings = (settings, role) => {
    if (!role) return settings;
    const rows = settings.homeRows || [];
    const homeRows = rows.some(row => row.id === 'library-tiles')
        ? rows.map(row => row.id === 'library-tiles' ? {...row, enabled: true, order: -1} : row)
        : [{id: 'library-tiles', enabled: true, order: -1}, ...rows];
    return {...settings, homeRows, kidsModeEnabled: role === 'child', pinCodeProtection: false,
        syncplayEnabled: false, showServerMessagesButton: false, showFriendsButton: false,
        serverLogging: false, autoLoginBehavior: 'disabled', autoLogin: false};
};
