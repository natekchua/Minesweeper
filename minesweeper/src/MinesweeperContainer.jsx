import React from "react";
import Minesweeper from "./Minesweeper";

const STATE_HIDDEN = "hidden";
let t = 0;
let timer = null;

export default class MinesweeperContainer extends React.Component {
  constructor(props) {
    super(props);
    this.nRows = 8;
    this.nCols = 10;
    this.state = {
      difficulty: "easy",
      nMines: 10,
      nFlagged: 0,
      arr: this.array2d(this.nRows, this.nCols, () => ({
        mine: false,
        state: STATE_HIDDEN,
        count: 0
      }))
    };
    this.updateFlagCount = this.updateFlagCount.bind(this);
  }

  array2d(nRows, nCols, val) {
    const res = [];
    for (let row = 0; row < nRows; row++) {
      res[row] = [];
      for (let col = 0; col < nCols; col++) res[row][col] = val(row, col);
    }
    return res;
  }

  // Timer functions provided by Emmanuel Onu during tutorial
  startTimer() {
    timer = setInterval(function () {
      t++;
      document.getElementById("timer").innerHTML = ("000" + t).substr(-3);
    }, 1000);
  }

  stopTimer() {
    if (timer) window.clearInterval(timer);
    document.getElementById("timer").innerHTML = "000".substr(-3);
    t = 0;
  }

  changeDifficulty(mode) {
    if (mode === "easy") {
      this.nRows = 8;
      this.nCols = 10;
      this.setState({
        difficulty: "easy",
        nMines: 10,
        arr: this.array2d(this.nRows, this.nCols, () => ({
          mine: false,
          state: STATE_HIDDEN,
          count: 0
        }))
      });
    } else {
      this.nRows = 14;
      this.nCols = 18;
      this.setState({
        difficulty: "medium",
        nMines: 40,
        arr: this.array2d(this.nRows, this.nCols, () => ({
          mine: false,
          state: STATE_HIDDEN,
          count: 0
        }))
      });
    }
  }

  updateFlagCount(nFlagged) {
    this.setState({
      nFlagged: nFlagged
    });
  }

  render() {
    const { nMines, nFlagged, arr } = this.state;
    return (
      <div className="container">
        <h1>Minesweeper</h1>
        <div id="game-header">
          <p>Flags left: {nMines - nFlagged}</p>
          <div id="timer">000</div>
          <select
            className="difficulty"
            onChange={(e) => this.changeDifficulty(e.target.value)}
            value={this.state.difficulty}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
          </select>
        </div>
        <Minesweeper
          difficulty={this.state.difficulty}
          startTimer={this.startTimer}
          stopTimer={this.stopTimer}
          updateFlagCount={this.updateFlagCount}
          rows={this.nRows}
          cols={this.nCols}
          mines={nMines}
          arr={arr}
          generate2DArray={this.array2d}
        />
      </div>
    );
  }
}
