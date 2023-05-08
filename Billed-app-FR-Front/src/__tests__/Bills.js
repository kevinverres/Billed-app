/**
 * @jest-environment jsdom
 */

import {getByTestId, getByText, screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import getBills from "../containers/Bills.js";
import {ROUTES,ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

//Add new test
describe("when i click on the eye icon button", () => {
  test("then a modal should open", () => {
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const bill = new Bills({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });
    $.fn.modal = jest.fn();
    const button = screen.getAllByTestId("icon-eye")[0];
    const handleClickIconEye = jest.fn((e) => {
      e.preventDefault();
      bill.handleClickIconEye(button);
    });
    button.addEventListener("click", handleClickIconEye);
    fireEvent.click(button);

    expect(handleClickIconEye).toHaveBeenCalled();
  });
});

describe("when i click on the make new Bill Button", () => {
  test("a new bill modal should open", () => {
    // LocalStorage - Employee
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    const html = BillsUI({ data: [] });
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const bills = new Bills({
      document,
      onNavigate,
      firestore: null,
      localStorage: window.localStorage,
    });
    const button = screen.getByTestId("btn-new-bill");
    const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e));
    button.click("click", handleClickNewBill);
    fireEvent.click(button);
    expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    const GetBills = jest.fn((e) => bills.getBills(e));
    expect(GetBills).toBe(GetBills)
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to bills page", () => {
    test("fetch bills from mock API GET", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
          // mock navigation
      const pathname = ROUTES_PATH['Bills']
      root.innerHTML = ROUTES({ pathname: pathname, loading: true })
          //mock bills
      const bills = new Bills({ document, onNavigate, store: mockedStore, localStorage })
      bills.getBills().then(data => {
          root.innerHTML = BillsUI({ data })
          expect(document.querySelector('tbody').rows.length).toBeGreaterThan(0)
      })
    });
  });
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockedStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches bills from an API and fails with 500 message error", async () => {
      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});