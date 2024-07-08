const memoryDb = new MemoryDB();
let editMode = false;
let editIndex = -1;

$(function () {
  $("#action-button").click(() => {
    if (editMode) {
      editItem();
      return;
    }

    addItem();
  });
});

async function convertCurrency(value, fromCurrency, toCurrency) {
  try {
    const { data } = await axios.get(
      `https://v6.exchangerate-api.com/v6/2428df8c61ba0a3a056e8604/latest/${fromCurrency}`
    );

    const conversionRate = data.conversion_rates[toCurrency];
    if (!conversionRate) {
      throw new Error();
    }

    return +(+value * +conversionRate).toFixed(2);
  } catch {
    alert("Erro ao converter moeda. Tente novamente mais tarde.");
    return 0;
  }
}

function redraw() {
  $("#result").empty();
  $("#total-container").empty();

  let totalAmount = 0;
  let totalConvertedAmount = 0;

  memoryDb.getKeys().forEach((key) => {
    const item = memoryDb.get(key);

    const itemAmount = item.quantity * item.itemValue;
    const itemConvertedAmount = item.quantity * (item.convertedValue || 0);

    totalAmount += itemAmount;
    totalConvertedAmount += itemConvertedAmount;

    const text = `
      <tr class="result-item">
          <td style="flex-grow: 2">
            ${item.description} (Qtd. ${item.quantity})
            ${item.itemValue} ${item.fromCurrency} => ${itemConvertedAmount} ${item.toCurrency}
          </td>
          <td>
              <button class="button fas fa-pencil-alt" onclick="setEditMode(${key})"></button>
          </td>
          <td>
              <button class="button fas fa-trash" style="background: red" onclick="removeItem(${key})"></button>
          </td>
      </tr>`;
    $("#result").append(text);
  });

  if (totalAmount && totalConvertedAmount) {
    const totalText = `
      <div class="content-row">
        <span id="from-total">Total (Moeda de Origem): ${totalAmount.toFixed(
          2
        )}</span>
      </div>
      <div class="content-row">
        <span id="to-total">Total (Moeda de Destino): ${totalConvertedAmount.toFixed(
          2
        )}</span>
      </div>`;

    $("#total-container").append(totalText);
  }
}

function validateValues({
  description,
  quantity,
  itemValue,
  fromCurrency,
  toCurrency,
}) {
  if (!description?.trim() || !itemValue || !fromCurrency || !toCurrency) {
    alert("Todos os campos são obrigatórios.");
    return false;
  }

  if (isNaN(quantity) || quantity <= 0) {
    alert("A quantidade deve ser um número maior que 0.");
    return false;
  }

  if (isNaN(itemValue) || itemValue <= 0) {
    alert("O valor do item deve ser um número maior que 0.");
    return false;
  }

  const allowedCurrencies = ["BRL", "USD", "EUR"];
  if (
    !allowedCurrencies.includes(fromCurrency) ||
    !allowedCurrencies.includes(toCurrency)
  ) {
    alert("As moedas devem ser BRL, USD ou EUR.");
    return false;
  }

  return true;
}

function clearFields() {
  $("#description").val("");
  $("#quantity").val("");
  $("#item-value").val("");
  $("#from-currency").val("BRL");
  $("#to-currency").val("BRL");
  $("#action-button").text("Adicionar");
}

function setEditMode(id) {
  editMode = true;
  editIndex = id;

  const item = memoryDb.get(id);
  if (!item) {
    editMode = false;
    editIndex = -1;
    return;
  }

  $("#description").val(item.description);
  $("#quantity").val(item.quantity);
  $("#item-value").val(item.itemValue);
  $("#from-currency").val(item.fromCurrency);
  $("#to-currency").val(item.toCurrency);
  $("#action-button").text("Salvar");
}

async function addItem() {
  const id = memoryDb.getLength();
  const description = $("#description").val();
  const quantity = $("#quantity").val();
  const itemValue = $("#item-value").val();
  const fromCurrency = $("#from-currency").find(":selected").text();
  const toCurrency = $("#to-currency").find(":selected").text();

  const validation = validateValues({
    description,
    quantity,
    itemValue,
    fromCurrency,
    toCurrency,
  });

  if (!validation) {
    return;
  }

  const convertedValue = await convertCurrency(
    itemValue,
    fromCurrency,
    toCurrency
  );

  memoryDb.set(id, {
    description,
    quantity,
    itemValue,
    fromCurrency,
    toCurrency,
    convertedValue,
  });
  clearFields();
  redraw();
}

async function editItem() {
  if (!editMode || editIndex === -1) {
    return;
  }

  const description = $("#description").val();
  const quantity = $("#quantity").val();
  const itemValue = $("#item-value").val();
  const fromCurrency = $("#from-currency").find(":selected").text();
  const toCurrency = $("#to-currency").find(":selected").text();

  const validation = validateValues({
    description,
    quantity,
    itemValue,
    fromCurrency,
    toCurrency,
  });

  if (!validation) {
    return;
  }

  const convertedValue = await convertCurrency(
    itemValue,
    fromCurrency,
    toCurrency
  );

  memoryDb.set(editIndex, {
    description,
    quantity,
    itemValue,
    fromCurrency,
    toCurrency,
    convertedValue,
  });

  editMode = false;
  editIndex = -1;
  clearFields();
  redraw();
}

function removeItem(id) {
  if (!confirm("Deseja realmente remover este item?")) {
    return;
  }

  memoryDb.delete(id);
  redraw();
}
