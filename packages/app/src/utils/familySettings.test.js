import {familySettings} from './familySettings';
test('local preferences cannot disable child restriction or re-enable cached auto login', () => {
    const input = {kidsModeEnabled: false, pinCodeProtection: true, autoLogin: true,
        homeRows: [{id: 'library-tiles', enabled: false, order: 4}]};
    const child = familySettings(input, 'child');
    expect(child.kidsModeEnabled).toBe(true);
    expect(child.pinCodeProtection).toBe(false);
    expect(child.autoLogin).toBe(false);
    expect(child.homeRows[0].enabled).toBe(true);
    expect(familySettings(input, 'adult').kidsModeEnabled).toBe(false);
    expect(familySettings(input, 'owner').homeRows[0].enabled).toBe(true);
    expect(input.homeRows[0].enabled).toBe(false);
    expect(familySettings(input, null)).toBe(input);
});
