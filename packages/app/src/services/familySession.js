// Enrollment is installed privately on the approved TV, never baked into a WGT.
export const familyEnrollment = () => {
    try {
        const value = JSON.parse(localStorage.getItem('atlas_profile_device') || 'null');
        return value && /^https:\/\//.test(value.server) && value.key ? value : null;
    } catch (_) { return null; }
};
let role = null;
export const familyRole = () => role;
export const setFamilyRole = value => { role = value; };
export const profileRequest = async (action, body = {}, token = '') => {
    const enrollment = familyEnrollment();
    if (!enrollment) throw new Error('Device not enrolled');
    // Raw fetch deliberately bypasses diagnostic URL/body tracing.
    const response = await fetch(`${enrollment.server}/AtlasProfiles/${action}`, {
        method: 'POST', headers: {'Content-Type': 'application/json', 'X-Atlas-Device': enrollment.key,
            ...(token ? {'X-Emby-Token': token} : {})}, body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(response.status === 429 ? 'Повторите позже: слишком много попыток.' : 'Не удалось войти. Проверьте код или повторите позже.');
    return response.json();
};
