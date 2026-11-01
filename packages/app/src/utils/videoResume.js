export const resumeTicks = (item) => {
    const position = Number(item?.UserData?.PlaybackPositionTicks) || 0;
    const duration = Number(item?.RunTimeTicks) || 0;
    if (item?.UserData?.Played || position <= 0 || !duration || position >= duration * 0.95 || duration - position < 100000000) return 0;
    return position;
};
export const resumeLabel = ticks => {
    const seconds = Math.floor(ticks / 10000000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
export const isPlayableVideo = item => !item?.IsFolder && ['Movie', 'Episode', 'Video'].includes(item?.Type);
