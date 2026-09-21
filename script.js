(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const amount = $("amount");
  const amountRange = $("amountRange");
  const rate = $("rate");
  const rateRange = $("rateRange");
  const tenure = $("tenure");
  const tenureRange = $("tenureRange");
  const tenureUnit = $("tenureUnit");

  const emiEl = $("emi");
  const principalEl = $("principal");
  const interestEl = $("interest");
  const totalEl = $("total");
  const ratioEl = $("ratio");

  const donut = $("donut");
  const donutPercent = $("donutPercent");
  const legendPrincipal = $("legendPrincipal");
  const legendInterest = $("legendInterest");

  const errorEl = $("error");
  const resetBtn = $("resetBtn");
  const scheduleBody = $("scheduleBody");
  const toggleSchedule = $("toggleSchedule");
  const scheduleWrap = $("scheduleWrap");
  const yearEl = $("year");

  const defaults = {
    amount: 3000000,
    rate: 8.5,
    years: 20
  };

  function money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Math.max(0, value || 0));
  }

  function calculateEMI(principal, annualRate, months) {
    if (months <= 0) return 0;

    if (annualRate === 0) {
      return principal / months;
    }

    const monthlyRate = annualRate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, months);

    return (
      principal *
      monthlyRate *
      factor /
      (factor - 1)
    );
  }

  function buildSchedule(principal, annualRate, months) {
    const regularEMI = calculateEMI(
      principal,
      annualRate,
      months
    );

    const monthlyRate = annualRate / 12 / 100;

    let balance = principal;
    const rows = [];

    for (
      let month = 1;
      month <= months && balance > 0.005;
      month++
    ) {
      const opening = balance;

      const interest =
        monthlyRate === 0
          ? 0
          : balance * monthlyRate;

      let payment = regularEMI;
      let principalPart = payment - interest;

      if (
        month === months ||
        principalPart > balance
      ) {
        principalPart = balance;
        payment = principalPart + interest;
      }

      balance = Math.max(
        0,
        balance - principalPart
      );

      rows.push({
        month,
        opening,
        principal: principalPart,
        interest,
        payment,
        closing: balance
      });
    }

    return rows;
  }

  function createYearRows(rows) {
    const result = [];

    for (let i = 0; i < rows.length; i += 12) {
      const yearRows = rows.slice(i, i + 12);

      if (!yearRows.length) continue;

      result.push({
        year: Math.floor(i / 12) + 1,
        opening: yearRows[0].opening,
        principal: yearRows.reduce(
          (sum, row) => sum + row.principal,
          0
        ),
        interest: yearRows.reduce(
          (sum, row) => sum + row.interest,
          0
        ),
        payment: yearRows.reduce(
          (sum, row) => sum + row.payment,
          0
        ),
        closing:
          yearRows[yearRows.length - 1].closing
      });
    }

    return result;
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
  }

  function render() {
    const loanAmount = Number(amount.value);
    const interestRate = Number(rate.value);
    const enteredTenure = Number(tenure.value);

    const months =
      tenureUnit.value === "years"
        ? enteredTenure * 12
        : enteredTenure;

    if (
      !Number.isFinite(loanAmount) ||
      loanAmount < 100000
    ) {
      showError(
        "Loan amount कम से कम ₹1,00,000 होना चाहिए।"
      );
      return;
    }

    if (
      !Number.isFinite(interestRate) ||
      interestRate < 0 ||
      interestRate > 30
    ) {
      showError(
        "Interest rate 0% से 30% के बीच रखें।"
      );
      return;
    }

    if (
      !Number.isFinite(months) ||
      months < 1 ||
      months > 360
    ) {
      showError(
        "Tenure 1 से 360 months के बीच रखें।"
      );
      return;
    }

    hideError();

    const rows = buildSchedule(
      loanAmount,
      interestRate,
      months
    );

    const principal = rows.reduce(
      (sum, row) => sum + row.principal,
      0
    );

    const interest = rows.reduce(
      (sum, row) => sum + row.interest,
      0
    );

    const total = rows.reduce(
      (sum, row) => sum + row.payment,
      0
    );

    const emi = rows.length
      ? rows[0].payment
      : 0;

    const interestShare =
      total > 0
        ? (interest / total) * 100
        : 0;

    emiEl.textContent = money(emi);
    principalEl.textContent = money(principal);
    interestEl.textContent = money(interest);
    totalEl.textContent = money(total);

    ratioEl.textContent =
      interestShare.toFixed(1) + "%";

    donutPercent.textContent =
      interestShare.toFixed(0) + "%";

    legendPrincipal.textContent =
      money(principal);

    legendInterest.textContent =
      money(interest);

    const principalShare =
      100 - interestShare;

    donut.style.background =
      "conic-gradient(#2563eb 0 " +
      principalShare +
      "%, #dbeafe " +
      principalShare +
      "% 100%)";

    scheduleBody.replaceChildren();

    const years = createYearRows(rows);

    years.forEach((row) => {
      const tr = document.createElement("tr");

      const values = [
        row.year,
        money(row.opening),
        money(row.principal),
        money(row.interest),
        money(row.payment),
        money(row.closing)
      ];

      values.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });

      scheduleBody.appendChild(tr);
    });
  }

  function sync(source, target) {
    target.value = source.value;
  }

  amount.addEventListener("input", () => {
    sync(amount, amountRange);
    render();
  });

  amountRange.addEventListener("input", () => {
    sync(amountRange, amount);
    render();
  });

  rate.addEventListener("input", () => {
    sync(rate, rateRange);
    render();
  });

  rateRange.addEventListener("input", () => {
    sync(rateRange, rate);
    render();
  });

  tenure.addEventListener("input", () => {
    const max =
      tenureUnit.value === "years"
        ? 30
        : 360;

    let value = Number(tenure.value);

    if (!Number.isFinite(value)) {
      value = 1;
    }

    value = Math.min(
      max,
      Math.max(1, value)
    );

    tenure.value = value;
    tenureRange.max = String(max);
    tenureRange.value = value;

    render();
  });

  tenureRange.addEventListener("input", () => {
    tenure.value = tenureRange.value;
    render();
  });

  tenureUnit.addEventListener("change", () => {
    if (tenureUnit.value === "months") {
      const years =
        Number(tenure.value) || 1;

      tenure.value = Math.min(
        360,
        years * 12
      );

      tenureRange.max = "360";
      tenureRange.value = tenure.value;
    } else {
      const months =
        Number(tenure.value) || 12;

      tenure.value = Math.min(
        30,
        Math.max(
          1,
          Math.round(months / 12)
        )
      );

      tenureRange.max = "30";
      tenureRange.value = tenure.value;
    }

    render();
  });

  resetBtn.addEventListener("click", () => {
    amount.value = defaults.amount;
    amountRange.value = defaults.amount;

    rate.value = defaults.rate;
    rateRange.value = defaults.rate;

    tenureUnit.value = "years";

    tenure.value = defaults.years;
    tenureRange.max = "30";
    tenureRange.value = defaults.years;

    render();
  });

  toggleSchedule.addEventListener("click", () => {
    const shouldShow = scheduleWrap.hidden;

    scheduleWrap.hidden = !shouldShow;

    toggleSchedule.textContent =
      shouldShow
        ? "Hide schedule"
        : "Show schedule";
  });

  yearEl.textContent =
    new Date().getFullYear();

  render();
})();
