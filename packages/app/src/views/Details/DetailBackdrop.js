import css from './Details.module.less';

// A person has no artwork worth blurring behind them, so they get the flat panel instead.
const DetailBackdrop = ({backdropUrl, isPerson, blur}) => (
	<>
		{backdropUrl && !isPerson && (
			<div className={css.backdrop}>
				<img
					src={backdropUrl}
					className={css.backdropImage}
					alt=""
					style={blur > 0 ? {filter: `blur(${blur}px)`} : undefined}
				/>
			</div>
		)}
		{isPerson && <div className={`${css.backdrop} ${css.personBackdrop}`} />}
		<div className={css.backdropGradient} />
	</>
);

export default DetailBackdrop;
