export function createTooltip() {
    let tooltip = null;

    function show(event, commit) {
        hide();
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-hash">${commit.id}</div>
            <div class="tooltip-message">${commit.message}</div>
            <div class="tooltip-meta">
                Branch: ${commit.branch}<br>
                ${commit.isMerge ? `Merged from: ${commit.mergeSource}<br>` : ''}
                Parents: ${commit.parents.length > 0 ? commit.parents.join(', ') : 'none'}
            </div>
        `;

        document.body.appendChild(tooltip);
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;

        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
        }
    }

    function hide() {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    }

    return { show, hide };
}
