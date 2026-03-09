/**
 * OpenAPI 컴포넌트 스키마 정의 - 메가박스/공통
 */

export const OPENAPI_MEGABOX_COMPONENT_SCHEMAS = {
  MegaboxTheater: {
    type: 'object',
    properties: {
      theaterId: { type: 'string', example: '1372' },
      theaterName: { type: 'string', example: '강남' },
      address: { type: 'string', example: '서울특별시 강남구 강남대로 438' },
      latitude: { type: 'number', format: 'float', example: 37.4982 },
      longitude: { type: 'number', format: 'float', example: 127.0264 },
      distanceKm: { type: 'number', format: 'float', example: 0.5 },
    },
  },
  MegaboxShowtime: {
    type: 'object',
    properties: {
      scheduleId: { type: 'string', example: '2603041372011' },
      movieId: { type: 'string', example: '25104500' },
      movieName: { type: 'string', example: '미키 17' },
      theaterId: { type: 'string', example: '1372' },
      theaterName: { type: 'string', example: '강남' },
      playDate: { type: 'string', example: '20260304' },
      startTime: { type: 'string', example: '09:30' },
      endTime: { type: 'string', example: '11:20' },
      totalSeats: { type: 'integer', example: 120 },
      remainingSeats: { type: 'integer', example: 42 },
    },
  },
  MegaboxTheaterSearchResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', format: 'float' },
              longitude: { type: 'number', format: 'float' },
            },
          },
          playDate: { type: 'string' },
          areaCode: { type: 'string' },
          theaters: {
            type: 'array',
            items: { $ref: '#/components/schemas/MegaboxTheater' },
          },
        },
      },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
      },
    },
  },
  MegaboxMovieListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          playDate: { type: 'string' },
          filters: {
            type: 'object',
            properties: {
              theaterId: { type: 'string', nullable: true },
              movieId: { type: 'string', nullable: true },
              areaCode: { type: 'string' },
            },
          },
          theaters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                theaterId: { type: 'string' },
                theaterName: { type: 'string' },
              },
            },
          },
          movies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                movieId: { type: 'string' },
                movieName: { type: 'string' },
                movieStatus: { type: 'string' },
              },
            },
          },
          showtimes: {
            type: 'array',
            items: { $ref: '#/components/schemas/MegaboxShowtime' },
          },
        },
      },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
        },
      },
    },
  },
  MegaboxSeatListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          playDate: { type: 'string' },
          filters: {
            type: 'object',
            properties: {
              theaterId: { type: 'string', nullable: true },
              movieId: { type: 'string', nullable: true },
              areaCode: { type: 'string' },
            },
          },
          seats: {
            type: 'array',
            items: { $ref: '#/components/schemas/MegaboxShowtime' },
          },
        },
      },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          pageSize: { type: 'integer' },
        },
      },
    },
  },
  MegaboxSeatMapSeat: {
    type: 'object',
    properties: {
      seatId: { type: 'string', example: '00100101' },
      seatLabel: { type: 'string', example: 'A1' },
      rowLabel: { type: 'string', example: 'A' },
      seatNumber: { type: 'integer', example: 1 },
      rowNumber: { type: 'integer', example: 1 },
      columnNumber: { type: 'integer', example: 1 },
      zoneCode: { type: 'string', nullable: true, example: 'GERN_ZONE' },
      classCode: { type: 'string', nullable: true, example: 'RECLINE_CLS' },
      statusCode: { type: 'string', nullable: true, example: 'GERN_SELL' },
      availability: { type: 'string', enum: ['available', 'unavailable'] },
      exposed: { type: 'boolean', example: true },
      coordinates: {
        type: 'object',
        properties: {
          x: { type: 'integer', example: 1 },
          y: { type: 'integer', example: 1 },
        },
      },
      selectionGroupName: { type: 'string', nullable: true, example: 'A2' },
      note: { type: 'string', nullable: true, example: null },
    },
  },
  MegaboxSeatMapPrice: {
    type: 'object',
    properties: {
      ticketKindCode: { type: 'string', example: 'TKA' },
      ticketTypeName: { type: 'string', example: '성인' },
      amounts: {
        type: 'object',
        additionalProperties: { type: 'integer' },
        example: {
          clsDisabledAmt: 15000,
          clsReclineAmt: 17000,
        },
      },
    },
  },
  MegaboxSeatMapScheduleOption: {
    type: 'object',
    properties: {
      scheduleId: { type: 'string', example: '2603101372011' },
      startTime: { type: 'string', example: '18:00' },
      endTime: { type: 'string', example: '20:07' },
      remainingSeats: { type: 'integer', example: 112 },
    },
  },
  MegaboxSeatMap: {
    type: 'object',
    properties: {
      scheduleId: { type: 'string', example: '2603101372011' },
      playDate: { type: 'string', example: '20260310' },
      movie: {
        type: 'object',
        properties: {
          movieId: { type: 'string', example: '25104501' },
          movieName: { type: 'string', example: '왕과 사는 남자' },
          playKindName: { type: 'string', nullable: true, example: '2D' },
          rating: { type: 'string', nullable: true, example: '12세이상관람가' },
        },
      },
      theater: {
        type: 'object',
        properties: {
          theaterId: { type: 'string', example: '1372' },
          theaterName: { type: 'string', example: '강남' },
          areaCode: { type: 'string', nullable: true, example: '10' },
        },
      },
      auditorium: {
        type: 'object',
        properties: {
          auditoriumId: { type: 'string', nullable: true, example: '03' },
          auditoriumName: { type: 'string', nullable: true, example: '르 리클라이너 3관' },
          auditoriumKindCode: { type: 'string', nullable: true, example: 'RCL' },
        },
      },
      time: {
        type: 'object',
        properties: {
          startTime: { type: 'string', example: '18:00' },
          endTime: { type: 'string', example: '20:07' },
        },
      },
      summary: {
        type: 'object',
        properties: {
          totalSeats: { type: 'integer', example: 116 },
          exposedSeats: { type: 'integer', example: 116 },
          availableSeats: { type: 'integer', example: 112 },
          unavailableSeats: { type: 'integer', example: 4 },
          maxTicketCount: { type: 'integer', example: 8 },
        },
      },
      seats: {
        type: 'array',
        items: { $ref: '#/components/schemas/MegaboxSeatMapSeat' },
      },
      ticketPrices: {
        type: 'array',
        items: { $ref: '#/components/schemas/MegaboxSeatMapPrice' },
      },
      scheduleOptions: {
        type: 'array',
        items: { $ref: '#/components/schemas/MegaboxSeatMapScheduleOption' },
      },
    },
  },
  MegaboxSeatMapResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          playSchdlNo: { type: 'string', example: '2603101372011' },
          seatMap: { $ref: '#/components/schemas/MegaboxSeatMap' },
        },
      },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 116 },
        },
      },
    },
  },
};
