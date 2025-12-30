document.addEventListener('DOMContentLoaded', () => {
    const numberInput = document.getElementById('numberInput');
    const unitLeadershipInput = document.getElementById('unitLeadershipInput');
    const leaderBoostCheckbox = document.getElementById('leaderBoostCheckbox');

    // Result elements
    const valPeople = document.getElementById('val-people');
    const valLeaderTotal = document.getElementById('val-leader-total');
    const valLeaderDetail = document.getElementById('val-leader-detail');
    const valEscort = document.getElementById('val-escort');
    const valDestroyer = document.getElementById('val-destroyer');
    const valCruiser = document.getElementById('val-cruiser');
    const errorMessage = document.getElementById('error-message');

    const MIN_VAL = 100000;
    const MAX_VAL = 500000;

    // Formatter for numbers
    const formatter = new Intl.NumberFormat('en-US');

    // Helper to format input value with commas
    const formatInputValue = (val) => {
        if (!val) return '';
        // Remove existing commas and non-digits
        const numStr = val.replace(/[^\d]/g, '');
        if (!numStr) return '';
        return parseInt(numStr, 10).toLocaleString('ja-JP');
    };

    // Load saved value from localStorage
    const savedLeadership = localStorage.getItem('totalLeadership');
    if (savedLeadership) {
        // Ensure saved value is formatted
        numberInput.value = formatInputValue(savedLeadership);
    }

    // Initialize Unit Leadership Dropdown (Multiples of 30, e.g., steps of 1500)
    // Range: 1500 to 60000
    const populateUnitLeadershipOptions = () => {
        const start = 1500;
        const end = 60000;
        const step = 1500; // 1500 is divisible by 30 (1500/30 = 50)

        for (let i = start; i <= end; i += step) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = formatter.format(i);
            if (i === 30000) option.selected = true;
            unitLeadershipInput.appendChild(option);
        }
    };

    populateUnitLeadershipOptions();

    const COST_ESCORT = 3;
    const COST_DESTROYER = 10;
    const COST_CRUISER = 30;
    const COST_FLAGSHIP = 200;

    const calculate = (totalLeadership, unitLeadership, boostLeader) => {
        // 1. Calculate cost per person (Unit Leadership + Flagship Cost)
        const costPerPerson = unitLeadership + COST_FLAGSHIP;

        // 2. Calculate max capacity (including leader)
        let maxCapacity = Math.floor(totalLeadership / costPerPerson);

        // 3. Calculate initial remainder
        let remainder = totalLeadership % costPerPerson;

        // 4. Initial Leader's total
        let leaderTotal = costPerPerson + remainder;

        // 5. Adjust for Leader Boost if enabled
        // Ensure leaderTotal >= 50,000 by reducing members
        if (boostLeader) {
            while (leaderTotal < 50000 && maxCapacity > 1) {
                maxCapacity--; // Reduce one person
                leaderTotal += costPerPerson; // Add their share to leader
                remainder += costPerPerson; // Update remainder tracking
            }
        }

        // Subtract leader from the count
        const members = Math.max(0, maxCapacity - 1);

        // 6. Calculate ship counts PER PERSON based on unitLeadership
        const escortPerPerson = Math.floor(unitLeadership / COST_ESCORT);
        const destroyerPerPerson = Math.floor(unitLeadership / COST_DESTROYER);
        const cruiserPerPerson = Math.floor(unitLeadership / COST_CRUISER);

        // 7. Calculate Leader's ship counts (Available = Leader Total - Flagship Cost)
        // Ensure non-negative
        const leaderAvailable = Math.max(0, leaderTotal - COST_FLAGSHIP);

        // Check if divisible (if not divisible, return null to indicate '-')
        const leaderEscort = (leaderAvailable % COST_ESCORT === 0) ? (leaderAvailable / COST_ESCORT) : null;
        const leaderDestroyer = (leaderAvailable % COST_DESTROYER === 0) ? (leaderAvailable / COST_DESTROYER) : null;
        const leaderCruiser = (leaderAvailable % COST_CRUISER === 0) ? (leaderAvailable / COST_CRUISER) : null;

        return {
            people: members,
            remainder: remainder,
            leaderTotal: leaderTotal,
            costPerPerson: costPerPerson,
            escort: escortPerPerson,
            destroyer: destroyerPerPerson,
            cruiser: cruiserPerPerson,
            leaderEscort: leaderEscort,
            leaderDestroyer: leaderDestroyer,
            leaderCruiser: leaderCruiser
        };
    };

    const updateResult = () => {
        const leadershipStr = numberInput.value;

        // Save to localStorage (save raw value or formatted, formatted is fine as we parse it back)
        localStorage.setItem('totalLeadership', leadershipStr);

        const unitLeadershipStr = unitLeadershipInput.value;
        const boostLeader = leaderBoostCheckbox.checked;

        // Remove commas for parsing
        const leadership = parseInt(leadershipStr.replace(/,/g, ''), 10);
        const unitLeadership = parseInt(unitLeadershipStr, 10);

        // Reset state
        errorMessage.classList.remove('visible');
        resetStyles(valPeople);
        resetStyles(valLeaderTotal);
        resetStyles(valEscort);
        resetStyles(valDestroyer);
        resetStyles(valCruiser);
        document.getElementById('val-escort-detail').textContent = '';
        document.getElementById('val-destroyer-detail').textContent = '';
        document.getElementById('val-cruiser-detail').textContent = '';
        valLeaderDetail.textContent = '';
        document.getElementById('val-leader-escort').textContent = '---';
        document.getElementById('val-leader-destroyer').textContent = '---';
        document.getElementById('val-leader-cruiser').textContent = '---';

        // Validation
        if (!leadershipStr || !unitLeadershipStr) {
            setPlaceholder(valPeople);
            setPlaceholder(valLeaderTotal);
            setPlaceholder(valEscort);
            setPlaceholder(valDestroyer);
            setPlaceholder(valCruiser);
            return;
        }

        if (isNaN(leadership) || isNaN(unitLeadership)) {
            setPlaceholder(valPeople);
            setPlaceholder(valLeaderTotal);
            setPlaceholder(valEscort);
            setPlaceholder(valDestroyer);
            setPlaceholder(valCruiser);
            return;
        }

        // Valid input
        const results = calculate(leadership, unitLeadership, boostLeader);

        animateValue(valPeople, results.people);
        animateValue(valLeaderTotal, results.leaderTotal);
        animateValue(valEscort, results.escort);
        animateValue(valDestroyer, results.destroyer);
        animateValue(valCruiser, results.cruiser);

        // Update sub-details (Total Leadership per person for that config)
        const totalCostStr = formatter.format(results.costPerPerson);
        document.getElementById('val-escort-detail').textContent = totalCostStr;
        document.getElementById('val-destroyer-detail').textContent = totalCostStr;
        document.getElementById('val-cruiser-detail').textContent = totalCostStr;

        // Update Leader's ship counts (Show '-' if null/not divisible)
        document.getElementById('val-leader-escort').textContent = results.leaderEscort !== null ? formatter.format(results.leaderEscort) : '-';
        document.getElementById('val-leader-destroyer').textContent = results.leaderDestroyer !== null ? formatter.format(results.leaderDestroyer) : '-';
        document.getElementById('val-leader-cruiser').textContent = results.leaderCruiser !== null ? formatter.format(results.leaderCruiser) : '-';

        // Update detail text
        valLeaderDetail.textContent = `(Standard ${formatter.format(results.costPerPerson)} + Remainder ${formatter.format(results.remainder)})`;
    };

    const handleInput = (e) => {
        // Format value
        const formatted = formatInputValue(e.target.value);
        numberInput.value = formatted;

        updateResult();
    };

    const showError = (msg) => {
        errorMessage.textContent = msg;
        errorMessage.classList.add('visible');
    };

    const setPlaceholder = (el) => {
        el.textContent = '---';
        el.classList.add('placeholder');
    };

    const resetStyles = (el) => {
        el.classList.remove('placeholder');
    };

    const animateValue = (el, value) => {
        el.textContent = formatter.format(value);
        el.classList.remove('placeholder');
    };

    // Event listeners
    numberInput.addEventListener('input', handleInput);
    unitLeadershipInput.addEventListener('change', updateResult);
    leaderBoostCheckbox.addEventListener('change', updateResult);

    // Initial calculation
    updateResult();
});
