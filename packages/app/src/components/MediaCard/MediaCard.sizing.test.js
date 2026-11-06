jest.mock('react', () => jest.requireActual('../../../../../node_modules/react'));
import {renderToStaticMarkup} from 'react-dom/server.node';
import MediaCard from './MediaCard';

jest.mock('@enact/spotlight/Spottable', () => tag => function MockSpot(props) {
	const clean = {...props};
	delete clean.spotlightId; delete clean.onSpotlightLeft; delete clean.onSpotlightRight;
	return require('react').createElement(tag, clean);
});
jest.mock('../../context/SettingsContext', () => ({useSettings: () => ({settings: {homeRowsPosterSize: 'default'}})}));
jest.mock('../../utils/helpers', () => ({getImageUrl: () => 'fixture-poster.svg', toAbsoluteImageUrl: value => value}));
jest.mock('../seerr/SeerrStatusBadge', () => ({SeerrSeasonDot: () => null}));
jest.mock('../AnimeMarkerPills', () => ({AnimeCardPill: () => null}));
jest.mock('../../hooks/useItemMenuHold', () => () => ({}));

test.each([true, false])('classic movie cards apply visible dimensions at the default preset (artwork: %s)', hasArtwork => {
	const container = document.createElement('div');
	container.innerHTML = renderToStaticMarkup(<MediaCard item={{
		Id: 'fixture', Type: 'Movie', Name: 'Fixture', ImageTags: hasArtwork ? {Primary: 'fixture'} : {}
	}} />);
	expect(container.querySelector('[data-media-card]').style.width).toBe('384px');
	const image = container.querySelector(hasArtwork ? 'img' : '[style="height:576px"]');
	expect(image).not.toBeNull();
	expect(image.style.height).toBe('576px');
});
