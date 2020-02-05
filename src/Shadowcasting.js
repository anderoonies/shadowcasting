import React, { Component } from "react";

const CELL_WIDTH = 1;
const BRIGHT_THRESHOLD = 10;
const DIM_THRESHOLD = 30;
const DARK_THRESHOLD = 60;
const DARKNESS_MAX = 500;

// http://www.roguebasin.com/index.php?title=FOV_using_recursive_shadowcasting
//              Shared
//             edge by
//  Shared     1 & 2      Shared
//  edge by\      |      /edge by
//  1 & 8   \     |     / 2 & 3
//           \1111|2222/
//           8\111|222/3
//           88\11|22/33
//           888\1|2/333
//  Shared   8888\|/3333  Shared
//  edge by-------@-------edge by
//  7 & 8    7777/|\4444  3 & 4
//           777/6|5\444
//           77/66|55\44
//           7/666|555\4
//           /6666|5555\
//  Shared  /     |     \ Shared
//  edge by/      |      \edge by
//  6 & 7      Shared     4 & 5
//             edge by
//             5 & 6
//

const octantTransforms = [
  { xx: 1, xy: 0, yx: 0, yy: 1 },
  { xx: 0, xy: 1, yx: 1, yy: 0 },
  { xx: 0, xy: -1, yx: 1, yy: 0 },
  { xx: -1, xy: 0, yx: 0, yy: 1 },
  { xx: -1, xy: 0, yx: 0, yy: -1 },
  { xx: 0, xy: -1, yx: -1, yy: 0 },
  { xx: 0, xy: 1, yx: -1, yy: 0 },
  { xx: 1, xy: 0, yx: 0, yy: -1 }
];

function Cell({ state, row, col, light, player, key, memory, onClick }) {
  let lightClass;
  if (light <= BRIGHT_THRESHOLD) {
    lightClass = "bright";
  } else if (light <= DIM_THRESHOLD) {
    lightClass = "dim";
  } else if (light <= DARK_THRESHOLD) {
    lightClass = "dark";
  } else {
    lightClass = "black";
  }

  if (light > DARK_THRESHOLD) {
    if (memory) {
      state = memory;
      if (state === "#") {
        lightClass = "remembered-wall";
      } else {
        lightClass = "remembered";
      }
    }
  } else {
    if (state === "#") {
      lightClass = "wall";
    }
  }

  return (
    <div
      key={key}
      row={row}
      col={col}
      className={`cell ${lightClass}`}
      onClick={onClick}
    >
      {player ? "X" : state}
    </div>
  );
}

function Grid({ dungeon, light, memory, playerPosition, onClick }) {
  return (
    <div className="grid">
      {dungeon.map((rowState, row) => {
        return (
          <div key={`row${row}`} className="row">
            {rowState.map((colState, col) => {
              let player = playerPosition.x === col && playerPosition.y === row;
              return Cell({
                state: colState,
                light: light[row][col],
                player,
                key: `cell${row}${col}`,
                row,
                col,
                onClick: function() {
                  onClick(row, col);
                },
                memory: memory[row][col]
              });
            })}
          </div>
        );
      })}
    </div>
  );
}

export default class Shadowscaster extends Component {
  constructor() {
    super();
    const dungeonString = [
      "#########################",
      "#...........#...........#",
      "#...........#........#..#",
      "#.....................#.#",
      "#....####..............##",
      "#.......#...............#",
      "#.......#...............#",
      "#.......#...........##..#",
      "#####........#......##..#",
      "#...#...................#",
      "#...#............#......#",
      "#########################"
    ];

    const dungeon = dungeonString.map(row => {
      return row.split("");
    });

    const height = dungeon.length;
    const width = dungeon[0].length;

    const initialLight = new Array(height)
      .fill(DARKNESS_MAX)
      .map(() => new Array(width).fill(DARKNESS_MAX));

    const initialMemory = new Array(height)
      .fill(0)
      .map(() => new Array(width).fill(0));

    const player = {
      x: 1,
      y: 1
    };

    this.state = {
      dungeon,
      height,
      width,
      light: initialLight,
      player,
      memory: initialMemory
    };

    this.updatedLight = initialLight;
    this.updatedMemory = initialMemory;
  }

  getSlope(x, y) {
    return (this.state.player.x - x) / (this.state.player.y - y);
  }

  cast({ startColumn, leftViewSlope, rightViewSlope, transform }) {
    let currentCol;
    let previousWasBlocked = false;
    let savedRightSlope = -1;
    for (
      let currentCol = startColumn;
      currentCol <= this.state.width;
      currentCol++
    ) {
      let xc = currentCol;
      for (let yc = currentCol; yc >= 0; yc--) {
        let gridX = this.state.player.x + xc * transform.xx + yc * transform.xy;
        let gridY = this.state.player.y + xc * transform.yx + yc * transform.yy;

        if (
          gridX < 0 ||
          gridX >= this.state.width ||
          gridY < 0 ||
          gridY >= this.state.height
        ) {
          continue;
        }

        // compute slopes to the corners of the current block, using to-left and bottom-right
        let leftBlockSlope = (yc + CELL_WIDTH / 2) / (xc - CELL_WIDTH / 2);
        let rightBlockSlope = (yc - CELL_WIDTH / 2) / (xc + CELL_WIDTH / 2);

        if (rightBlockSlope > leftViewSlope) {
          continue;
        } else if (leftBlockSlope < rightViewSlope) {
          break;
        }

        let distanceSquared = Math.max(xc * xc + yc * yc);
        this.updatedLight[gridY][gridX] = distanceSquared;
        if (distanceSquared <= DARK_THRESHOLD) {
          this.updatedMemory[gridY][gridX] = this.state.dungeon[gridY][gridX];
        }

        let currentlyBlocked = this.state.dungeon[gridY][gridX] === "#";
        if (previousWasBlocked) {
          if (currentlyBlocked) {
            // keep traversing
            savedRightSlope = rightBlockSlope;
          } else {
            previousWasBlocked = false;
            leftViewSlope = savedRightSlope;
          }
        } else {
          if (currentlyBlocked) {
            if (leftBlockSlope <= leftViewSlope) {
              this.cast({
                startColumn: currentCol + 1,
                leftViewSlope,
                rightViewSlope: leftBlockSlope,
                transform
              });
            }

            previousWasBlocked = true;
            savedRightSlope = rightBlockSlope;
          }
        }
      }

      if (previousWasBlocked) {
        break;
      }
    }
  }

  scan() {
    this.setState({
      light: new Array(this.state.height)
        .fill(DARKNESS_MAX)
        .map(() => new Array(this.state.width).fill(DARKNESS_MAX))
    });

    this.updatedLight = Object.assign({}, this.state.light);
    this.updatedLight[this.state.player.y][this.state.player.x] = 0;
    for (var octant = 0; octant < 8; octant++) {
      this.cast({
        startColumn: 1,
        leftViewSlope: 1.0,
        rightViewSlope: 0.0,
        transform: octantTransforms[octant]
      });
    }
    this.setState({
      light: this.updatedLight,
      memory: this.updatedMemory
    });
  }

  componentDidMount() {
    this.scan();
    window.addEventListener("keydown", e => {
      if (e.keyCode === 38) {
        this.setState({
          player: {
            ...this.state.player,
            y: Math.max(0, this.state.player.y - 1)
          }
        });
      } else if (e.keyCode === 40) {
        this.setState({
          player: {
            ...this.state.player,
            y: Math.min(this.state.height, this.state.player.y + 1)
          }
        });
      } else if (e.keyCode === 37) {
        this.setState({
          player: {
            ...this.state.player,
            x: Math.max(0, this.state.player.x - 1)
          }
        });
      } else if (e.keyCode === 39) {
        this.setState({
          player: {
            ...this.state.player,
            x: Math.min(this.state.width, this.state.player.x + 1)
          }
        });
      }
      this.scan();
    });
  }

  toggle(row, col) {
    let dungeon = this.state.dungeon;
    dungeon[row][col] = dungeon[row][col] === "#" ? "." : "#";
    this.setState({
      dungeon: dungeon
    });
    this.scan();
  }

  render() {
    console.log(this.state.memory);
    console.log(this.state.light);
    return (
      <div className="CA">
        {Grid({
          dungeon: this.state.dungeon,
          light: this.state.light,
          memory: this.state.memory,
          playerPosition: this.state.player,
          onClick: (row, col) => {
            this.toggle(row, col);
          }
        })}
      </div>
    );
  }
}
