import {AdvancedOptionsPopup} from '../../components/seerr/AdvancedOptionsPopup';
import {CancelRequestPopup} from '../../components/seerr/CancelRequestPopup';
import {ManageRequestsPopup} from '../../components/seerr/ManageRequestsPopup';
import {QualitySelectionPopup} from '../../components/seerr/QualitySelectionPopup';
import {ReportIssuePopup} from '../../components/seerr/ReportIssuePopup';
import {SeasonSelectionPopup} from '../../components/seerr/SeasonSelectionPopup';

// The popups the Seerr actions raise. They all run off the overlay, so a screen with no Seerr
// side renders nothing at all here.
const SeerrDialogs = ({seerr, title}) => {
	if (!seerr.isActive) return null;

	const isTv = seerr.mediaType === 'tv';

	return (
		<>
			<QualitySelectionPopup
				open={seerr.showQualityPopup}
				title={title}
				hdStatus={seerr.hdStatus}
				status4k={seerr.status4k}
				canRequestHd={seerr.canRequestHd}
				canRequest4k={seerr.canRequest4k}
				quota={isTv ? seerr.quota?.tv : seerr.quota?.movie}
				isTv={isTv}
				onSelect={seerr.handleRequestTrack}
				onClose={seerr.handleCloseQualityPopup}
			/>

			{isTv && (
				<SeasonSelectionPopup
					open={seerr.showSeasonPopup}
					title={title}
					seasons={seerr.details?.seasons}
					seasonStatusMap={seerr.pendingIs4k ? seerr.seasonStatusMap4k : seerr.seasonStatusMapHd}
					quota={seerr.quota?.tv}
					onConfirm={seerr.handleSeasonConfirm}
					onClose={seerr.handleCloseSeasonPopup}
				/>
			)}

			{seerr.showsReportIssue && (
				<ReportIssuePopup
					open={seerr.showReportPopup}
					title={title}
					isTv={isTv}
					seasons={seerr.details?.seasons}
					onSubmit={seerr.handleReportSubmit}
					onClose={seerr.handleCloseReportPopup}
				/>
			)}

			{seerr.hasAdvanced && (
				<AdvancedOptionsPopup
					open={seerr.showAdvancedPopup}
					title={title}
					servers={seerr.servers}
					is4k={seerr.pendingIs4k}
					onConfirm={seerr.handleAdvancedConfirm}
					onClose={seerr.handleCloseAdvancedPopup}
				/>
			)}

			<CancelRequestPopup
				open={seerr.showCancelPopup}
				requests={seerr.cancelTargets}
				title={title}
				onConfirm={seerr.handleCancelConfirm}
				onClose={seerr.handleCloseCancelPopup}
			/>

			{seerr.showsManage && (
				<ManageRequestsPopup
					open={seerr.showManagePopup}
					pendingRequests={seerr.pendingRequests}
					title={title}
					onResolve={seerr.handleResolveRequest}
					onClose={seerr.handleCloseManagePopup}
				/>
			)}
		</>
	);
};

export default SeerrDialogs;
