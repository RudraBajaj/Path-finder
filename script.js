document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const GRID_SIZE = 20; // Larger board (20x20)
    const ANIMATION_SPEED = 30;
    const gridContainer = document.getElementById('grid-container');
    
    // State variables
    let startCell, endCell;
    let isSettingStart = false;
    let isSettingEnd = false;
    
    // Initialize application
    createStatusDisplay();
    createGrid();
    createControlPanel();
    
    // ========================
    // 1. Core Grid Functions
    // ========================
    
    function createGrid() {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
        
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridContainer.appendChild(cell);
                
                cell.addEventListener('click', () => {
                    if (isSettingStart) {
                        if (cell !== endCell && !cell.classList.contains('wall')) {
                            if (startCell) startCell.classList.remove('start');
                            startCell = cell;
                            startCell.classList.add('start');
                            isSettingStart = false;
                            updateStatus('Start point set. Click "Set End" or "Find Path"');
                        }
                    } else if (isSettingEnd) {
                        if (cell !== startCell && !cell.classList.contains('wall')) {
                            if (endCell) endCell.classList.remove('end');
                            endCell = cell;
                            endCell.classList.add('end');
                            isSettingEnd = false;
                            updateStatus('End point set. Click "Find Path" to search.');
                        }
                    } else {
                        if (cell !== startCell && cell !== endCell) {
                            cell.classList.toggle('wall');
                            updateStatus('Board modified. Click "Find Path" to search.');
                        }
                    }
                });
            }
        }
        
        startCell = document.querySelector('[data-row="0"][data-col="0"]');
        endCell = document.querySelector(`[data-row="${GRID_SIZE-1}"][data-col="${GRID_SIZE-1}"]`);
        startCell.classList.add('start');
        endCell.classList.add('end');
    }
    
    // ========================
    // 2. Optimized BFS (Shortest Path with Diagonals)
    // ========================
    
    function findPath() {
        document.querySelectorAll('.visited, .path').forEach(cell => {
            cell.classList.remove('visited', 'path');
        });
        
        updateStatus('Finding optimal path...', 'searching');
        
        // Priority: Straight moves first, then diagonals
        const directions = [
            [1, 0], [0, 1], [-1, 0], [0, -1],  // Orthogonal
            [1, 1], [1, -1], [-1, 1], [-1, -1]   // Diagonal
        ];
        
        const queue = [[startCell, [startCell]]];
        const visited = new Set([`${startCell.dataset.row},${startCell.dataset.col}`]);
        const visitedOrder = [];
        const distanceMap = new Map(); // Tracks shortest distance to each cell
        distanceMap.set(`${startCell.dataset.row},${startCell.dataset.col}`, 0);
        
        while (queue.length > 0) {
            const [current, path] = queue.shift();
            
            if (current !== startCell && current !== endCell) {
                visitedOrder.push(current);
            }
            
            if (current === endCell) {
                animateSearch(visitedOrder, () => {
                    animatePath(path, () => {
                        updateStatus('✓ Path found!', 'success');
                    });
                });
                return;
            }
            
            for (const [dr, dc] of directions) {
                const row = parseInt(current.dataset.row) + dr;
                const col = parseInt(current.dataset.col) + dc;
                const cellKey = `${row},${col}`;
                
                if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) continue;
                
                const neighbor = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (!neighbor || neighbor.classList.contains('wall') || visited.has(cellKey)) continue;
                
                // Calculate new distance (1 for straight, ~1.4 for diagonal)
                const newDistance = distanceMap.get(`${current.dataset.row},${current.dataset.col}`) + 
                                    (Math.abs(dr) + Math.abs(dc) === 2 ? 1.414 : 1);
                
                if (!distanceMap.has(cellKey)) {
                    distanceMap.set(cellKey, newDistance);
                    visited.add(cellKey);
                    queue.push([neighbor, [...path, neighbor]]);
                }
            }
        }
        
        animateSearch(visitedOrder, () => {
            updateStatus('✗ No path exists!', 'error');
        });
    }
    
    // ========================
    // 3. Animation System (Unchanged)
    // ========================
    
    function animateSearch(cells, callback) {
        let i = 0;
        function animate() {
            if (i < cells.length) {
                cells[i].classList.add('visited');
                i++;
                setTimeout(animate, ANIMATION_SPEED);
            } else callback();
        }
        animate();
    }
    
    function animatePath(path, callback) {
        let i = 0;
        function animate() {
            if (i < path.length) {
                if (path[i] !== startCell && path[i] !== endCell) {
                    path[i].classList.add('path');
                }
                i++;
                setTimeout(animate, ANIMATION_SPEED * 2);
            } else callback();
        }
        animate();
    }
    
    // ========================
    // 4. UI Components (Unchanged)
    // ========================
    
    function createStatusDisplay() {
        const statusDisplay = document.createElement('div');
        statusDisplay.id = 'status-display';
        statusDisplay.textContent = 'Pathfinder ready. Set walls and click "Find Path"';
        document.body.insertBefore(statusDisplay, gridContainer);
    }
    
    function updateStatus(message, statusType = '') {
        const statusDisplay = document.getElementById('status-display');
        statusDisplay.textContent = message;
        statusDisplay.className = statusType;
    }
    
    function createControlPanel() {
        const controls = document.createElement('div');
        controls.className = 'controls';
        
        const startBtn = document.createElement('button');
        startBtn.textContent = 'Set Start';
        startBtn.addEventListener('click', () => {
            isSettingStart = true;
            isSettingEnd = false;
            updateStatus('Click any cell to set new START point');
        });
        
        const endBtn = document.createElement('button');
        endBtn.textContent = 'Set End';
        endBtn.addEventListener('click', () => {
            isSettingEnd = true;
            isSettingStart = false;
            updateStatus('Click any cell to set new END point');
        });
        
        const findBtn = document.createElement('button');
        findBtn.textContent = 'Find Path';
        findBtn.addEventListener('click', findPath);
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear Board';
        clearBtn.addEventListener('click', () => {
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('wall', 'visited', 'path');
            });
            isSettingStart = false;
            isSettingEnd = false;
            updateStatus('Board cleared. Ready for pathfinding.');
        });
        
        controls.append(startBtn, endBtn, findBtn, clearBtn);
        document.body.insertBefore(controls, gridContainer);
    }
});