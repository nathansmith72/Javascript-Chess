/*
** Author : Nathan Smith
** Title  : ChessGame
** ToDo   : 1. Reorganize code in a more readable way
** 			2. create a turn based system so that white must go first, then black, and so on.
**			3. Add the row and column rank symbols to the sides of the board
**			4. create a restart button that will reset the board
**          5. Improve the artwork
**			6. Create a move list and embed it in a scroll pane
**			7. Create a timer
**			8. Create an A.I. opponents of different difficulty levels
**			9. create database storing of records and stats vs different A.I. levels
**			10. create multi-player functionality
**			11. rename deletedPieceX, deletedPieceY, and deletedPieceType
**			12. program valid move rules for the queen and king
*/

////////////////////////////////////////
// Beginning of variable declarations //
////////////////////////////////////////

	var canvas
	var c
	var rect
	var pieceInHand = 0;
	var pieceInHandType = 0;
			
	/*
	** The three "deleted" variables hold the values of the piece currently in the
	** hand of the player. I called it deleted piece because when the player grabs
	** a piece the original one disappears and a new one is drawn in the players hand.
	** I would like to rename them to selectedPieceX, selectedPieceY, and selectedPieceType
	** in the near future
	*/
	var deletedPieceX = null;
	var deletedPieceY = null;
	var deletedPieceType = null;
	
	var enPassantCaptureX = -1;
	var enPassantcaptureY = -1;
	
	var currentMove = 1;
	
	/*
	** These two variables are not currently in use but They will be necessary in the future
	*/
	var whiteInCheck = 0;
	var blackInCheck = 0;
	
	/*
	** These values are place holders that we will modify when needed
	** to get the current location of the mouse.
	*/
	var mouse = {
			x: 0,
			y: 0
	};
			
	/*
	** These values are just place holders for the canvas's x and y values
	** The values will be properly initialized in the window.onload function
	*/
	var canvasPosition = {
		x: 0,
		y: 0
	};
	
	/*
	** These variables tell us how man rows and columns are on the chess board,
	** and the width and height of each square.
	*/
	var boardDeminsions = {
		rows: 8,
		columns: 8,
		width: 75,
		height: 75
	}
	
	/*
	** Create a 8x8 2d array that will serve as the data representation
	** of the pieces on the board.
	*/
	var boardArray = new Array(boardDeminsions.width);
	for(var i = 0; i<boardDeminsions.width; i++){
		boardArray[i] = new Array(boardDeminsions.height);
	}
	
//////////////////////////////////
// End of variable declarations //
//////////////////////////////////
	
	/* Entry point for the game */
	window.onload = function(){
	
		/* This code is used to get a context for the game */
		canvas = document.getElementById("canvas");
		c = canvas.getContext("2d");
		
		/* 
		** This code is used to initialize the variables stored
		** in canvas position so we can later use them to calculate
		** relative mouse co-ordinates
		*/
		rect = canvas.getBoundingClientRect();
		canvasPosition.x = rect.left;
		canvasPosition.y = rect.top;
		
		/* Here is where we declare the mouse event handlers */
		canvas.onmousedown = handleMouseDown;
		canvas.onmouseup = handleMouseUp;
		canvas.onmousemove = handleMouseMove;
		
		/* Call init() which will start loading all of the artwork */
		init();
		
		/*
		** This function will reset boardArray[]'s values to the normal
		** starting position of a chess game.
		*/
		resetBoard();
		
		/*
		** drawBoard() will draw alternating dark and light squares after the
		** square images have loaded, and drawPieces() will use the data in 
		** boardArray[] to draw the pieces on those squares after the piece
		** images have finished loading.
		*/
		lightSquare.onload = function(){
			drawBoard();
		}
		blackRook.onload = function(){
			drawPieces();
		}
	}
	
	function updateMouseXY(e){
		/* 
		** This code is used to update the x and y position of the mouse
		** relative to the canvas.
		*/
		mouse = {
			x: e.pageX - canvasPosition.x,
			y: e.pageY - canvasPosition.y
		}
	}
	
	function handleMouseMove(e) {
		/* update the mouse co-ordinates */
		updateMouseXY(e);
		
		/*
		** redraw the board and pieces so pieces don't "streak" as
		** the player moves them across the board
		*/
		drawBoard();
		drawPieces();
		
		/* if the player is holding a piece, draw that piece under the mouse */
		if(pieceInHand = 1){
			drawPieceAtLocation(mouse.x-37,mouse.y-37, pieceInHandType);
		}
	}	
	
	function handleMouseDown(e) {
		/* update the mouse co-ordinates */
		updateMouseXY(e)
		
		/* use mouse co-ordinates to find what square the mouse is on */
		var xSquare = Math.floor(mouse.x/75);
		var ySquare = Math.floor(mouse.y/75);
		
		/* 
		** if there is a piece on the square the player clicked on, this
		** code will run
		*/
		if(boardArray[xSquare][ySquare] != 0){
			/*
			** The player will now have a piece in his hand so pieceinHand = 1,
			** and we store the pieces original co-ordinates in the deltedPiece variables.
			** we also store the pieces type in the pieceInHandType variable so we can draw it.
			** this is redundant and will be edited out later when the deletedPiece variable
			** names are changed in a later version
			*/
			pieceInHand = 1;
			deletedPieceX = xSquare;
			deletedPieceY = ySquare;
			deletedPieceType = boardArray[xSquare][ySquare]
			pieceInHandType = deletedPieceType;
			
			/* 
			** We change the boardArray variable to 0 so the piece 
			** disappears from its original location 
			*/
			boardArray[xSquare][ySquare] = 0;
			
			/* Now we draw the board and pieces in their updated location */
			drawBoard();
			drawPieces();
			
			/* And then we draw the piece that is in the players hand */
			drawPieceAtLocation(mouse.x-37, mouse.y-37, pieceInHandType); 
		}
	}
	
	/*
	** This function will handle when the mouse is released. It checks
	** to see if the player is holding a piece. If he/she is, it will
	** check to see if the square it was released on constitutes a valid move.
	** If it is then the piece is moved and the board state is updated
	*/
	function handleMouseUp(e) {
		//update the mouse co-ordinates
		updateMouseXY(e)
		/*
		** This code is used to figure out which square the mouse is currently
		** located on.
		*/
		var xSquare = Math.floor(mouse.x/75);
		var ySquare = Math.floor(mouse.y/75);
		
		if(pieceInHand == 1){
		
			/*
			** If the move is not allowed then this black of code
			** will handle updating the board.
			*/
			if(isMoveAllowed(xSquare, ySquare) == 0){
				console.log("move not allowed");
				boardArray[deletedPieceX][deletedPieceY] = deletedPieceType;
				deletedPieceX = null;
				deletedPieceY = null;
				deletedPieceType = null;
				
			/*
			** If the move is allowed then this block of code
			** will handle updating the board.
			*/
			} else if(isMoveAllowed(xSquare, ySquare) == 1){
				console.log("move Allowed");
				boardArray[xSquare][ySquare] = deletedPieceType;
				deletedPieceX = null;
				deletedPieceY = null;
				deletedPieceType = null;
			}
			
			/*
			** Since the event has been handled, there should no longer be a 
			** piece in the players hand, so we will zero out these variables
			** and then redraw the board and pieces
			*/
			pieceInHand = 0;
			pieceInHandType = 0;
			drawBoard();
			drawPieces();
		}
	}
	/*
	**load all of the images
	*/
	function init(){

		darkSquare = new Image();
		darkSquare.src = "Images/DarkSquares.png";
		
		lightSquare = new Image();
		lightSquare.src = "Images/LightSquares.png";
		
		blackPawn = new Image();
		blackPawn.src = "Images/BlackPawn.png";
		
		whitePawn = new Image();
		whitePawn.src = "Images/WhitePawn.png";
		
		blackRook = new Image();
		blackRook.src = "Images/BlackRook.png";
		
		whiteRook = new Image();
		whiteRook.src = "Images/WhiteRook.png";
		
		blackBishop = new Image();
		blackBishop.src = "Images/BlackBishop.png";
		
		whiteBishop = new Image();
		whiteBishop.src = "Images/WhiteBishop.png";
		
		blackKnight = new Image();
		blackKnight.src = "Images/BlackKnight.png";
		
		whiteKnight = new Image();
		whiteKnight.src = "Images/whiteKnight.png";
		
		whiteQueen = new Image();
		whiteQueen.src = "Images/whiteQueen.png";
		
		blackQueen = new Image();
		blackQueen.src = "Images/blackQueen.png";
		
		whiteKing = new Image();
		whiteKing.src = "Images/whiteKing.png";
		
		blackKing = new Image();
		blackKing.src = "Images/blackKing.png";
	}
	
	/* 
	** this function draws the board by adding the array indexes together
	** and if they are divisible evenly by 2(meaning they add up to an even
	** number) then a darkSquare is drawn at that location. Otherwise a dark
	** square is drawn. 0 is considered an even number by this algorithm
	*/
	function drawBoard(){
		for(var i = 0; i < boardDeminsions.rows;i++){
			for(var j = 0; j < boardDeminsions.columns; j++){
				if((i+j)%2!=0){
						c.drawImage(darkSquare, i*boardDeminsions.width, j*boardDeminsions.height);
				} else {
						c.drawImage(lightSquare, i*boardDeminsions.width, j*boardDeminsions.height);
				}
			}
		}
	}
	/*
	**	This function simply draws a piece at a certain x and y co-ordinate.
	**  it takes in the x and y positions and the piece type as parameters
	**  and uses a switch statement with the piece type as the parameter
	**  to decide what image to draw.
	*/
	function drawPieceAtLocation(x, y, piece){
		switch(piece){
			case 1:
				c.drawImage(whitePawn, x, y);
				break;
			case 2:
				c.drawImage(whiteKnight, x, y);
				break;
			case 3:
				c.drawImage(whiteBishop, x, y);
				break;
			case 4:
				c.drawImage(whiteRook, x, y);
				break;
			case 5:
				c.drawImage(whiteQueen, x, y);
				break;
			case 6:
				c.drawImage(whiteKing, x, y);
				break;
			case 7:
				c.drawImage(blackPawn, x, y);
				break;
			case 8:
				c.drawImage(blackKnight, x, y);
				break;
			case 9:
				c.drawImage(blackBishop, x, y);
				break;
			case 10:
				c.drawImage(blackRook, x, y);
				break;
			case 11:
				c.drawImage(blackQueen, x, y);
				break;
			case 12:
				c.drawImage(blackKing, x, y);
				break;
		}
	}
	
	/*
	**  Draw the pieces on the board based on the boardArray[][] variable
	*/
	function drawPieces(){
		for(var i = 0; i < boardDeminsions.rows; i++){
			for(var j = 0; j< boardDeminsions.columns; j++){
				if(boardArray[i][j] != 0){
					drawPieceAtLocation(i*boardDeminsions.width, j*boardDeminsions.height, boardArray[i][j]);
				} 
			}
		}
	}
	
	/* 
	** this function checks to see if the piece on
	** a particular square is black and returns true
	** if it is. This is used as a check to make sure
	** that black doesn't try to capture his own pieces
	*/
	function isBlackPiece(x,y){
		var result = 0;
		for (var i = 7; i < 13; i++){
			if (boardArray[x][y] == i){
				result = 1;
			}
		}
		return result;
	}
	
	/* 
	** this function checks to see if the piece on
	** a particular square is white and returns true
	** if it is. This is used as a check to make sure
	** that white doesn't try to capture his own pieces.
	** This is redundant as we all ready have a isBlackPiece()
	** function and only one function should be necessary
	** to check whether a piece on a square is black or white.
	** this should be changed in a upcoming version.
	*/
	function isWhitePiece(x,y){
		var result = 0;
		for (var i = 1; i < 7; i++){
			if (boardArray[x][y] == i){
				result = 1;
			}
		}
		return result;
	}
	
	/* 
	** This function sets the values in boardArray[][] to a standard
	** chess board starting position.
	*/
	function resetBoard(){
		for(var i = 0; i < 8; i++){
			for (var j=0; j<8; j++){
				boardArray[i][j] = 0;
			}
		}
		
		for(var i = 0; i < 8; i++){ /* black pawns occupy these square */
			boardArray[i][1] = 7;
		}
		for(var i = 0; i < 8; i++){ /* white pawns occupy these square */
			boardArray[i][6] = 1;
		}
		
		/* black rooks occupy these squares */
		boardArray[0][0] = 10; 
		boardArray[7][0] = 10;
		
		/* black knights occupy these squares */
		boardArray[1][0] = 8;
		boardArray[6][0] = 8;
		
		/* black bishops occupy these squares */
		boardArray[2][0] = 9;
		boardArray[5][0] = 9;
		
		/* the black queen occupies this square */
		boardArray[3][0] = 11;
		
		/* the black king occupies this square */
		boardArray[4][0] = 12;
		
		/* white rooks occupy these squares */
		boardArray[0][7] = 4;
		boardArray[7][7] = 4;
		
		/* white knights occupy these squares */
		boardArray[1][7] = 2;
		boardArray[6][7] = 2;
		
		/* white bishops occupy these squares */
		boardArray[2][7] = 3;
		boardArray[5][7] = 3;
		
		/* white queen occupies this square */
		boardArray[3][7] = 5;
		
		/* white king occupies this square */
		boardArray[4][7] = 6;
	}
	
	function isMoveAllowed(x, y){
		switch(deletedPieceType){
		case 1: //  handles valid move logic for white pawns
		
			//make sure player doesn't take his own piece
			if(isWhitePiece(x,y) == 1){
				return 0;
			}
			
			//this code handles moving a pawn 2 spaces from its start point
			if(y+2 == 6 && x == deletedPieceX && boardArray[x][y] == 0 && boardArray[x][y+1] == 0){
				enPassantCaptureX = x;		//en passant variables stored incase of capture
				enPassantCaptureY = y+1;	//en passant variables stored incase of capture
				return 1;
			}
			//this code handles 1 square forward moves
			else if (y+1 == deletedPieceY && x == deletedPieceX && boardArray[x][y] == 0){
				return 1;
				
			//this code handles capturing forward and to the left or right
			} else if (y + 1 == deletedPieceY && boardArray[x][y] != 0){
				if(x == deletedPieceX + 1 || x == deletedPieceX-1){
					return 1;
				} else {
					return 0;
				}
			}	
			
			//this code handles en passant capturing
			else if (y + 1 == deletedPieceY && x == enPassantCaptureX && y == enPassantCaptureY){
				if(x == deletedPieceX+1 || x == deletedPieceX -1){
					boardArray[x][y+1] = 0;
					return 1;
				} else {
					return 0;
				}
			}
			
			//return 0 when the move is not valid
			else {
				return 0;
			}
		case 2: //handles valid move logic for white knights
			//make sure player doesn't take his own piece
			if(isWhitePiece(x,y) == 1){
				return 0;
			}
			
			if(x == deletedPieceX + 2 && y == deletedPieceY + 1){
				return 1;
			} else if ( x == deletedPieceX + 2 && y == deletedPieceY - 1){
				return 1;
			} else if(x == deletedPieceX - 2 && y == deletedPieceY + 1){
				return 1;
			} else if(x == deletedPieceX - 2 && y == deletedPieceY - 1){
				return 1;
			} else if(x == deletedPieceX + 1 && y == deletedPieceY + 2){
				return 1;
			} else if(x == deletedPieceX + 1 && y == deletedPieceY - 2){
				return 1;
			} else if(x == deletedPieceX - 1 && y == deletedPieceY + 2){
				return 1;
			} else if(x == deletedPieceX - 1 && y == deletedPieceY - 2){
				return 1;
			} else {
				return 0;
			}
		case 3: // handles valid move logic for white bishop
			//declare variables that will be used 
			//to make sure bishop does not go through pieces
			
			//make sure player doesn't take his own piece
			if(isWhitePiece(x,y) == 1){
				return 0;
			}
			
			var changeInX;
			var changeInY;
			var xOnPath = deletedPieceX;
			var yOnPath = deletedPieceY;
			var result;
			
			if(x > deletedPieceX){
				changeInX = 1
			}  else {
				changeInX = -1
			}
			if(y > deletedPieceY){
				changeInY = 1
			}  else {
				changeInY = -1
			}
			if(Math.abs(x-deletedPieceX) == Math.abs(y-deletedPieceY)){
				result = 1;
				while(xOnPath != x-changeInX && yOnPath != y-changeInY){
					xOnPath += changeInX;
					yOnPath += changeInY;
					if(boardArray[xOnPath][yOnPath] != 0){
						result = 0;
					}
				} 
				return result;
			} else {
				return 0;
			}
		case 4:
			//variables necessary for making sure no pieces are in the way
			var changeInX = 0;
			var changeInY = 0;
			
			//make sure player doesn't take his own piece
			if(isWhitePiece(x,y) == 1){
				console.log("tried to take a white piece");
				return 0;
			}
			
			//logic for when moving along y axis
			if(x == deletedPieceX && y != deletedPieceY){
				
				if (deletedPieceY < y){
					changeInY = 1;
				} else {
					changeInY = -1;
				}
				
				for (var i = deletedPieceY+changeInY; i!= y; i+=changeInY){
					if( boardArray[x][i] != 0){
						return 0;
					}
				}
			}
			
			//logic for when moving along x axis
			if(x != deletedPieceX && y == deletedPieceY){
				
				if (deletedPieceX < x){
					changeInX = 1;
				} else {
					changeInX = -1;
				}
				
				for (var i = deletedPieceX + changeInX; i!= x; i+=changeInX){
					if( boardArray[i][y] != 0){
						return 0;
					}
				}
			}
			
			//if the move is allowed, return 1
			return 1;
			
		case 7: //this handles valid move logic for black pawns
			//handles 2 square moves from starting position
			
			//make sure player doesn't take his own piece
			if(isBlackPiece(x,y) == 1){
				return 0;
			}
			
			if(y-2 == 1 && x == deletedPieceX && boardArray[x][y] == 0 && boardArray[x][y-1] == 0){
				enPassantCaptureX = x;
				enPassantCaptureY = y-1;
				return 1;
			}
			
			//handles 1 square moves forward
			else if (y-1 == deletedPieceY && x == deletedPieceX && boardArray[x][y] == 0){
				return 1;
			}
			
			//handles capturing forward and to the left or right
			else if (y - 1 == deletedPieceY && boardArray[x][y] != 0){
				if(x == deletedPieceX + 1 || x == deletedPieceX-1){
					return 1;
				} else {
					return 0;
				}
			}
			//handles en passant capturing
			else if (y - 1 == deletedPieceY && x == enPassantCaptureX && y == enPassantCaptureY){
				if(x == deletedPieceX+1 || x == deletedPieceX -1){
					boardArray[x][y-1] = 0;
					return 1;
				} else {
					return 0
				}
			} else {
				return 0;
			}
		case 8: //handles valid move logic for white knights
			
			//make sure player doesn't take his own piece
			if(isBlackPiece(x,y) == 1){
				return 0;
			}
			
			if(x == deletedPieceX + 2 && y == deletedPieceY + 1){
				return 1;
			} else if ( x == deletedPieceX + 2 && y == deletedPieceY - 1){
				return 1;
			} else if(x == deletedPieceX - 2 && y == deletedPieceY + 1){
				return 1;
			} else if(x == deletedPieceX - 2 && y == deletedPieceY - 1){
				return 1;
			} else if(x == deletedPieceX + 1 && y == deletedPieceY + 2){
				return 1;
			} else if(x == deletedPieceX + 1 && y == deletedPieceY - 2){
				return 1;
			} else if(x == deletedPieceX - 1 && y == deletedPieceY + 2){
				return 1;
			} else if(x == deletedPieceX - 1 && y == deletedPieceY - 2){
				return 1;
			} else {
				return 0;
			}
		case 9: // handles valid move logic for black bishop
			//declare variables that will be used 
			//to make sure bishop does not go through pieces
			
			//make sure player doesn't take his own piece
			if(isBlackPiece(x,y) == 1){
				return 0;
			}
			
			var changeInX;
			var changeInY;
			var xOnPath = deletedPieceX;
			var yOnPath = deletedPieceY;
			var result;
			
			if(x > deletedPieceX){
				changeInX = 1
			}  else {
				changeInX = -1
			}
			if(y > deletedPieceY){
				changeInY = 1
			}  else {
				changeInY = -1
			}
			if(Math.abs(x-deletedPieceX) == Math.abs(y-deletedPieceY)){
				result = 1;
				while(xOnPath != x-changeInX && yOnPath != y-changeInY){
					xOnPath += changeInX;
					yOnPath += changeInY;
					if(boardArray[xOnPath][yOnPath] != 0){
						result = 0;
					}
				} 
				return result;
			} else {
				return 0;
			}
		case 10: // handles valid move logic for black Rook
			//variables necessary for making sure no pieces are in the way
			var changeInX = 0;
			var changeInY = 0;
			
			//make sure player doesn't take his own piece
			if(isBlackPiece(x,y) == 1){
				console.log("tried to take a black piece");
				return 0;
			}
			
			//logic for when moving along y axis
			if(x == deletedPieceX && y != deletedPieceY){
				
				if (deletedPieceY < y){
					changeInY = 1;
				} else {
					changeInY = -1;
				}
				
				for (var i = deletedPieceY+changeInY; i!= y; i+=changeInY){
					if( boardArray[x][i] != 0){
						return 0;
					}
				}
			}
			
			//logic for when moving along x axis
			if(x != deletedPieceX && y == deletedPieceY){
				
				if (deletedPieceX < x){
					changeInX = 1;
				} else {
					changeInX = -1;
				}
				
				for (var i = deletedPieceX + changeInX; i!= x; i+=changeInX){
					if( boardArray[i][y] != 0){
						return 0;
					}
				}
			}
			
			//if the move is allowed, return 1
			return 1;
			
		default:
			return 0;
		}
	}