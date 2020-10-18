import React, { useEffect, useState, useRef } from "react";

const STATE_HIDDEN = "hidden";
const STATE_SHOWN = "shown";
const STATE_FLAGGED = "flagged";
const GAME_MESSAGES = ["You snooze, you lose!", "Congratulations, you won!"];
const CELL_COLORS = {
  "1": "blue",
  "2": "green",
  "3": "red",
  "4": "purple"
};

function Minesweeper(props) {
  // ------------------------ VARIABLES ------------------------ //

  const mounted = useRef();
  const [nFlagged, setNFlagged] = useState(0);
  const [nUncovered, setNUncovered] = useState(0);
  const [nMoves, setNMoves] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [gridView, setGridView] = useState([]);
  const [arr, setArr] = useState(props.arr);

  const nRows = props.rows;
  const nCols = props.cols;
  let nMines = props.mines;
  let nUncoveredCounter = nUncovered;
  let movesCounter = nMoves;

  // ------------------------ HOOKS ------------------------ //

  // ComponentWillReceiveProps equivalent
  useEffect(() => {
    setArr(props.arr);
    reset();
  }, [props.arr]);

  useEffect(() => {
    if (!mounted.current) {
      // ComponentDidMount equivalent
      setGridDimensions();
      setGridView(getRendering());
      mounted.current = true;
    } else {
      // ComponentDidUpdate equivalent
      if (arr.length === nRows) {
        props.updateFlagCount(nFlagged);
        setGridDimensions();
        setGridView(getRendering());
      } else return;

      if (exploded || nUncovered === nRows * nCols - nMines) {
        props.stopTimer();
        document.querySelector("#overlay").classList.toggle("active");
        // callback for overlay click - hide overlay and regenerate game
        document.querySelector("#overlay").addEventListener("click", () => {
          reset();
          document.querySelector("#overlay").classList.remove("active");
        });
      }
    }
  }, [nFlagged, nUncovered, exploded, arr]);

  // ------------------------ FUNCTIONS ------------------------ //

  // Apply grid dimensons and cell size upon difficulty change
  const setGridDimensions = () => {
    let grid = document.getElementById("grid");
    let buttonSize = grid.clientWidth / nCols;
    grid.style.gridTemplateColumns = `repeat(${nCols}, ${buttonSize}px)`;
    grid.style.gridTemplateRows = `repeat(${nRows}, ${buttonSize}px)`;
  };

  // returns array of strings representing the rendering of the board
  //      "H" = hidden cell - no bomb
  //      "F" = hidden cell with a flag
  //      "M" = mine (game should be over now)
  // '0'..'9' = number of mines in adjacent cells
  const getRendering = () => {
    let s = [];
    for (let row = 0; row < nRows; row++) {
      for (let col = 0; col < nCols; col++) {
        let a = arr[row][col];
        if (exploded && a.mine) s.push({ status: "M", coords: [row, col] });
        else if (a.state === STATE_HIDDEN)
          s.push({ status: "", coords: [row, col] });
        else if (a.state === STATE_FLAGGED)
          s.push({ status: "F", coords: [row, col] });
        else if (a.mine) s.push({ status: "M", coords: [row, col] });
        else s.push({ status: a.count.toString(), coords: [row, col] });
      }
    }
    return s;
  };

  // determines the the selected cell is valid or not.
  const validCoord = (row, col) => {
    return row >= 0 && row < nRows && col >= 0 && col < nCols;
  };

  //
  const count = (row, col) => {
    const c = (r, c) => (validCoord(r, c) && arr[r][c].mine ? 1 : 0);
    let res = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) res += c(row + dr, col + dc);
    return res;
  };

  // prepare a list of allowed coordinates for mine placement
  const sprinkleMines = (row, col) => {
    props.startTimer();

    let allowed = [];
    let arrCopy = arr;
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        if (Math.abs(row - r) > 2 || Math.abs(col - c) > 2)
          allowed.push([r, c]);
      }
    }
    nMines = Math.min(nMines, allowed.length);

    for (let i = 0; i < nMines; i++) {
      let j = rndInt(i, allowed.length - 1);
      [allowed[i], allowed[j]] = [allowed[j], allowed[i]];
      let [r, c] = allowed[i];
      arrCopy[r][c].mine = true;
    }
    // erase any flags (in case user placed them) and update counts
    let existingFlags = 0;
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        if (arrCopy[r][c].state === STATE_FLAGGED) {
          arrCopy[r][c].state = STATE_HIDDEN;
          existingFlags++;
        }
        arrCopy[r][c].count = count(r, c);
      }
    }
    let mines = [];
    for (let row = 0; row < nRows; row++) {
      let s = "";
      for (let col = 0; col < nCols; col++) {
        s += arrCopy[row][col].mine ? "B" : ".";
      }
      s += "  |  ";
      for (let col = 0; col < nCols; col++) {
        s += arrCopy[row][col].count.toString();
      }
      mines[row] = s;
    }
    setNFlagged(nFlagged - existingFlags);
  };

  // uncovers a cell (left click / tap functionality)
  const uncover = (row, col) => {
    let arrCopy = arr;
    if (!validCoord(row, col)) return false;
    // Don't uncover if there is a flag in this cell
    if (arrCopy[row][col].state === STATE_FLAGGED) return false;
    // if this is the very first move, populate the mines, but make
    // sure the current cell does not get a mine
    if (nUncovered === 0) sprinkleMines(row, col);
    // if cell is not hidden, ignore this move
    if (arrCopy[row][col].state !== STATE_HIDDEN) return false;
    // floodfill all 0-count cells
    const ff = (r, c) => {
      if (!validCoord(r, c)) return;
      if (arrCopy[r][c].state !== STATE_HIDDEN) return;
      arrCopy[r][c].state = STATE_SHOWN;
      nUncoveredCounter++;
      if (arrCopy[r][c].count !== 0) return;
      ff(r - 1, c - 1);
      ff(r - 1, c);
      ff(r - 1, c + 1);
      ff(r, c - 1);
      ff(r, c + 1);
      ff(r + 1, c - 1);
      ff(r + 1, c);
      ff(r + 1, c + 1);
    };
    ff(row, col);

    movesCounter++;

    setNUncovered(nUncoveredCounter);
    setNMoves(movesCounter);
    setGridView(getRendering());

    // have we hit a mine?
    if (arrCopy[row][col].mine) {
      setExploded(true);
    }
    return true;
  };

  // flags a cell at a given coordinate (this is the 'right-click' functionality)
  const flag = (row, col) => {
    let arrCopy = arr;
    let flaggedCounter = nFlagged;
    // if coordinates invalid, refuse this request
    if (!validCoord(row, col)) return false;
    // if cell already flagged, refuse this
    if (arrCopy[row][col].state === STATE_SHOWN) return false;
    // accept the move and flip the flagged status
    flaggedCounter += arrCopy[row][col].state === STATE_FLAGGED ? -1 : 1;
    arrCopy[row][col].state =
      arrCopy[row][col].state === STATE_FLAGGED ? STATE_HIDDEN : STATE_FLAGGED;
    setNFlagged(flaggedCounter);
    setArr(arrCopy);

    return true;
  };

  // returns random integer in range [min, max]
  const rndInt = (min, max) => {
    [min, max] = [Math.ceil(min), Math.floor(max)];
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // reset state variables upon finishing a game or changing difficulty
  const reset = () => {
    props.stopTimer();
    setArr(
      props.generate2DArray(nRows, nCols, () => ({
        mine: false,
        state: STATE_HIDDEN,
        count: 0
      }))
    );
    setNUncovered(0);
    setNFlagged(0);
    setNMoves(0);
    setExploded(false);
  };

  // generate rendered grid in UI
  const generateGrid = () => {
    return (
      <>
        {gridView.map((cell, index) => (
          <div
            className="cell"
            key={index}
            onClick={() => uncover(cell.coords[0], cell.coords[1])}
            onContextMenu={(e) => {
              e.preventDefault();
              flag(cell.coords[0], cell.coords[1]);
            }}
          >
            <div style={{ color: CELL_COLORS[cell.status] }}>{cell.status}</div>
          </div>
        ))}
      </>
    );
  };

  return (
    <>
      <div id="grid">{generateGrid()}</div>
      <div id="overlay">
        <div id="overlayin">
          <p className="big glow">
            {exploded ? GAME_MESSAGES[0] : GAME_MESSAGES[1]}
          </p>
          <p className="darker">
            It took you <span className="moveCount">{nMoves}</span> moves.
          </p>
          <p className="darker">Click anywhere to start a new game. </p>
        </div>
      </div>
    </>
  );
}

export default Minesweeper;
