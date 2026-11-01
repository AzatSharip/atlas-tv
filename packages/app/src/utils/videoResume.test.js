import {resumeTicks, isPlayableVideo} from './videoResume';
import {createSeekGesture, seekTarget} from './seekGesture';

test('resume uses incomplete server progress and ignores credits/completed items', () => {
    const item = {RunTimeTicks: 6000000000, UserData: {PlaybackPositionTicks: 1200000000}};
    expect(resumeTicks(item)).toBe(1200000000);
    expect(resumeTicks({...item, UserData: {...item.UserData, Played: true}})).toBe(0);
    expect(resumeTicks({...item, UserData: {PlaybackPositionTicks: 5990000000}})).toBe(0);
    expect(resumeTicks({UserData: item.UserData})).toBe(0);
    expect(resumeTicks({...item, UserData: {PlaybackPositionTicks: 0}})).toBe(0);
});
test('only playable video cards skip details', () => {
    ['Movie', 'Episode', 'Video'].forEach(Type => expect(isPlayableVideo({Type})).toBe(true));
    expect(isPlayableVideo({Type: 'Video', IsFolder: true})).toBe(false);
    expect(isPlayableVideo({Type: 'Series'})).toBe(false);
});
test('held seek accelerates; release and direction change reset; bounded at both ends', () => {
    const gesture = createSeekGesture();
    expect(gesture.step(1, 0)).toBe(15);
    expect(gesture.step(1, 1000)).toBe(15);
    expect(gesture.step(1, 1500)).toBe(30);
    gesture.step(1, 2500);
    expect(gesture.step(1, 3300)).toBe(60);
    expect(gesture.step(-1, 3400)).toBe(-15);
    gesture.reset();
    expect(gesture.step(1, 3500)).toBe(15);
    expect(seekTarget(5000, -15, 10000)).toBe(0);
    expect(seekTarget(5000, 15, 10000)).toBe(9750);
});
