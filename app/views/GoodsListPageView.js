import React,{Component} from 'react'
import {View,SectionList,StatusBar,TextInput,StyleSheet,Platform,ScrollView,TouchableWithoutFeedback,ActivityIndicator,TouchableOpacity,Animated,Easing} from 'react-native'
import {Container,Header,Content,List,ListItem,Left,Body,Right,Thumbnail,Button,Text,Spinner,Icon} from 'native-base'
import Image from 'react-native-image-progress';
import ProgressBar from 'react-native-progress/Bar'
//api
import api from '../api';
import source from '../api/CancelToken';
import {cancel_goods_list_request} from '../api';
//components
import GoodsSwiper from '../components/Swiper';
import Dropdownfilter from '../components/Dropdownfilter';
import Loading from '../components/Loading';
import ErrorPage from '../components/ErrorPage';
import Divider from '../components/Divider';
import MapModal from '../components/CommonModal';
import Rating from '../components/Rating';
//utils
import GLOBAL_PARAMS from '../utils/global_params';
import Colors from '../utils/Colors';
import ToastUtil from '../utils/ToastUtil';
import ListFooter from '../components/ListFooter';
import _ from 'lodash';

let requestParams = {
  status: {
    LOADING: 0,
    LOAD_SUCCESS: 1,
    LOAD_FAILED: 2,
    NO_MORE_DATA: 3
  },
  currentPage: 1,
  isFirstTime: false //判断是不是第一次触发sectionlist的onendreach方法
}

const diffplatform = {
  preventViewTop:Platform.select({ios: 62, android: 0}),
}

export default class GoodsListPageView extends Component{
  _isMounted = false // 監測組件是否加載完畢
  sectionList = null
  sview = null // 滾動視圖
  onEndReachedCalledDuringMomentum = false
  textInput = null

  state = {
      loading: false,
      canteenDetail: [],
      adDetail: [],
      canteenOptions: null,
      showFilterList: false,
      isMapModalShow: false,
      httpRequest: null,
      positionTop: new Animated.Value(0),
      firstPageLoading: GLOBAL_PARAMS.httpStatus.LOADING,
      pullUpLoading: GLOBAL_PARAMS.httpStatus.LOAD_SUCCESS,
  }

  componentWillMount = () => {
    this.getCanteenList()
  }


  componentDidMount() {
    // console.log(111,this.props);
    this._isMounted = true
    this.getCanteenOption()
    this.getAd()
  }

  componentWillUnmount = () => {
    this._isMounted = false
    source.cancel()
  }

  componentWillReceiveProps(nextProps) {
    // console.log('nextprops',nextProps)
    // this._onRequestFirstPageData()
  }

  //api function
  getCanteenList = (filter) => {
    api.getCanteenList(requestParams.currentPage,filter).then(data => {
      // console.log(data)
      if(this._isMounted) {
        if(data.status === 200) {
          this.setState({
            canteenDetail: data.data.data,
            firstPageLoading: GLOBAL_PARAMS.httpStatus.LOAD_SUCCESS
          })
        }
        else{
          this.setState({
            // canteenDetail: data.data.data,
            firstPageLoading: GLOBAL_PARAMS.httpStatus.LOAD_FAILED
          })
        }
      }
    },() => {
      ToastUtil.showWithMessage('网络请求出错')
      this.setState({
          firstPageLoading:GLOBAL_PARAMS.httpStatus.LOAD_FAILED
      })
    })
  }

  getCanteenOption = () => {
    api.getCanteenOptions().then(data => {
      if(data.status === 200 ){
        const _newCanteenOptionsArr = []
        for(let i in data.data) {
          data.data[i].unshift(['default','全部'])
          data.data[i] = _.chunk(data.data[i],3);
          switch (i) {
            case 'areas':_newCanteenOptionsArr.push({name:'地區',enName:'areas',value:data.data[i]});break;
            case 'categories':_newCanteenOptionsArr.push({name:'分類',enName:'categories',value:data.data[i]});break;
            case 'seats':_newCanteenOptionsArr.push({name:'人數',enName:'seats',value:data.data[i]});break;
          }
        }
        this.setState({
          canteenOptions: _newCanteenOptionsArr
        })
      }
    },() => {
      ToastUtil.showWithMessage('网络请求出错',)
    })
  }

  getAd = () => {
    api.adSpace().then(data => {
      if(data.status === 200) {
        this.setState({
          adDetail: data.data.data
        })
      }
    })
  }

  // common function

  _onErrorRequestFirstPage = () => {
    this.setState({
        firstPageLoading: GLOBAL_PARAMS.httpStatus.LOADING
    })
    this._onRequestFirstPageData()
  }

  _requestNextDetailList() {
    api.getCanteenList(requestParams.currentPage).then(data => {
      if(data.status === 200) {
        // console.log(data)
        if(data.data.data.length === 0) {
          requestParams.currentPage --
          this.setState({
            canteenDetail:this.state.canteenDetail.concat(data.data.data),
            pullUpLoading:GLOBAL_PARAMS.httpStatus.NO_MORE_DATA
          })
          return
        }
        this.setState({
          canteenDetail:this.state.canteenDetail.concat(data.data.data),
          pullUpLoading:GLOBAL_PARAMS.httpStatus.LOAD_SUCCESS
        })
      }
    },() => {
      requestParams.currentPage --
      this.setState({
        pullUpLoading: GLOBAL_PARAMS.httpStatus.LOAD_FAILED
      })
    })
  }

  _onEndReached = () => {
    if(this.state.pullUpLoading !== GLOBAL_PARAMS.httpStatus.LOAD_SUCCESS) {
      return ;
    }
    this.setState({
      pullUpLoading: GLOBAL_PARAMS.httpStatus.LOADING
    })
    requestParams.currentPage ++
    this._requestNextDetailList()
  }

  _onErrorToRequestNextPage() {
    this.setState({
      pullUpLoading:GLOBAL_PARAMS.httpStatus.LOADING
    })
    requestParams.currentPage ++;
    this._requestNextDetailList()
  }

  _onRequestFirstPageData = () => {
    requestParams.currentPage = 1
    this.getCanteenList()
  }

  _onFilterEmptyData = () => {
    requestParams.currentPage = 1
    this.getCanteenList()
    this.props.screenProps.resetFilter()
  }

  _toToggleFilterListView= () => {
    this.sectionList.scrollToLocation({
      sectionIndex: 0,
      itemIndex: 0,
      viewPosition: 0,
      viewOffset: 0,
      })
    let timer = setTimeout(() => {
      this.setState({
        showFilterList: !this.state.showFilterList
      })
      Animated.spring(this.state.positionTop, {
         toValue: this.state.showFilterList? 1 : 0, // 目标值
         duration: 1000, // 动画时间
         easing: Easing.linear // 缓动函数
       }).start();
      clearTimeout(timer)
    },0)
    // let timer = setTimeout(() => {
    //   Animated.spring(this.state.positionTop, {
    //     toValue: this.state.showFilterList? 0 : 1, // 目标值
    //     duration: 1000, // 动画时间
    //     easing: Easing.linear // 缓动函数
    //   }).start();
    //   clearTimeout(timer)
    // },1000)

  }

  _confirmToFilter = (data) => {
    // console.log('data',data)
    requestParams.currentPage = 1
    this.setState({
      firstPageLoading: GLOBAL_PARAMS.httpStatus.LOADING
    })
    this._toToggleFilterListView(0)
    let timer = setTimeout(() => {
      clearTimeout(timer)
      this.getCanteenList(data)
    },0)
  }

  _openMapModal = () => {
    this.setState({
      isMapModalShow: true
    })
  }

//views
  _renderModalView = () => (
    <MapModal
      modalVisible={this.state.isMapModalShow}
      closeFunc={() => this.setState({isMapModalShow:false})}
      {...this['props']['screenProps']}/>
  )

  _renderSubHeader = (section) => {
    return (
      <View style={{
        borderColor:'#ccc',
        borderBottomWidth:1,
        zIndex:100,
        width:GLOBAL_PARAMS._winWidth,
        height:50,
        display:'flex',
        justifyContent:'center',
        backgroundColor:'#fff',
        flexDirection:'row'}}>
        <View style={{flex:1,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
          <Text>- 为您推薦 -</Text>
        </View>
        <View style={{flex:1,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
        </View>
        <TouchableOpacity onPress={() => this._toToggleFilterListView()}
          style={{flex:1,alignItems:'center',justifyContent:'center',flexDirection:'row'}}>
          {/* <Icon name='md-menu' style={{fontSize:20,color:this.props.theme,marginRight:5}}/> */}
          <Text style={{color:this.props.screenProps.theme}}>篩選分類</Text>
        </TouchableOpacity>
      </View>
      // <View style={{paddingTop:15,paddingBottom:15,backgroundColor:Colors.main_white,borderBottomWidth:1,borderColor:Colors.main_gray}}>
      //   <Text style={{textAlign:'center',fontSize:16}}>- 為您推薦 -</Text>
      // </View>
    )
  }

  _renderFilterView= () => {
    return (
      <Animated.View style={{
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white',
        position: 'absolute',
        zIndex: 100,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        width: GLOBAL_PARAMS._winWidth,
        height: 400,
        top: this.state.positionTop.interpolate({
            inputRange: [0, 1],
            outputRange: [-420, 62]
        })
      }}>
        <Dropdownfilter filterData={this.state.canteenOptions}
          confirmToDo={(data) => this._confirmToFilter(data)}
          cancleToDo={() =>{
            this._toToggleFilterListView(0)
          }} {...this['props']}/>
      </Animated.View>
    )
  }

  _renderPreventClickView= () => {
    return this.state.showFilterList ? <TouchableWithoutFeedback onPress={() => this._toToggleFilterListView(0)}>
        <View style={{
            width: GLOBAL_PARAMS._winWidth,
            height: GLOBAL_PARAMS._winHeight,
            position: 'absolute',
            zIndex: 99,
            top: diffplatform.preventViewTop,
            left: 0,
            backgroundColor: '#5b7492',
            opacity: 0.3
        }}/>
    </TouchableWithoutFeedback> : null;
  }

  _renderSectionList= (data,key) =>{
    return (
        <SectionList
          ref={(sectionList) => this.sectionList = sectionList}
          // onScroll={(sview) => this._getListViewData(sview)}
          sections={[
            {title:'餐廳列表',data:this.state.canteenDetail},
          ]}
          shouldItemUpdate = {(props,nextProps) => {
            return props.item !== nextProps.item
          }}
          stickySectionHeadersEnabled={true}
          renderItem={({item,index}) => {return this.state.canteenDetail.length > 0 ? this._renderSectionListItem(item,index) : null}}
          keyExtractor={(item, index) => index} // 消除SectionList warning
          renderSectionHeader={({section}) => this._renderSubHeader(section)}
          // refreshing={true}
          initialNumToRender={6}
          getItemLayout={(data,index) => ({length: 75, offset: 75 * index + 175, index: index})}
          // onRefresh={() => alert('onRefresh: nothing to refresh :P')}
          // onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
          onEndReachedThreshold={1}
          onEndReached={() => this._onEndReached()}
          // onEndReached={this._onEndReached.bind(this)}
          ListHeaderComponent={() => {return this.state.adDetail === null && this.state.canteenDetail.length > 0 ? null : <GoodsSwiper {...this['props']} adDetail={this.state.adDetail}/>}}
          ListEmptyComponent={() => (
            <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
              <Text>沒有數據了...</Text>
            </View>
          )}
          ListFooterComponent={() => (<ListFooter style={{backgroundColor:Colors.main_white}} 
            loadingStatus={this.state.pullUpLoading}
            errorToDo={() => this._onErrorToRequestNextPage()}/>)}
        />
    )
  }

_renderSectionListItem = (item,index) => {
  let hasImage = item.image !== '#';
  return (
    <View>
      <ListItem
        style={{backgroundColor:Colors.main_white,marginLeft:0,paddingLeft:10}}
        avatar key={index} onPress={() =>this.props.navigation.navigate('Content',{
          data:item,
          kind:'canteen'
        })}>
        <Left style={{marginLeft: 10}}>
          <Image style={{width:90,height:90,borderRadius:45}} imageStyle={{borderRadius: 45}} source={{uri:!hasImage ? 'default_image' : item.image}} />
        </Left>
        <Body style={{height:120,borderBottomWidth:0,justifyContent:'center'}}>
          <Text style={{marginBottom:10,fontSize:18}} numberOfLines={1}>{item.name}</Text>
          <Text note style={{fontSize:13,marginBottom:10}}>地址：{item.address.length > 12 ? item.address.substr(0,11) + '...' : item.address}</Text>
          <Rating rate={item.rate} {...this['props']}/>
          {/*<View style={{flexDirection:'row',alignItems:'center'}}>
            <View style={{backgroundColor:'#b3b3b3',borderRadius:10,width:80,padding:5,marginRight:10}}>
              <Text style={{color:'#fff',textAlign:'center'}}>0.5公里</Text>
            </View>
            <Text>距離當前位置</Text>
          </View> */}
        </Body>
        <Right style={{borderBottomWidth:0}}>
          <Text note style={{color:this.props.screenProps.theme,fontSize:25,fontWeight:'bold'}}>${item.price}</Text>
        </Right>
      </ListItem>
      {this.state.canteenDetail.length-1 === index ? null : <Divider height={10} bgColor='transparent'/>}
    </View>
)}

  render(){
    return (
      <Container style={{backgroundColor:Colors.bgColor}}>
        {this._renderModalView()}
        {this.state.firstPageLoading === GLOBAL_PARAMS.httpStatus.LOADING ?
          <Loading message="玩命加載中..."/> : (this.state.firstPageLoading === GLOBAL_PARAMS.httpStatus.LOAD_FAILED ?
          <ErrorPage errorTips="加載失敗,請點擊重試" errorToDo={this._onErrorRequestFirstPage}/> : null)}
        {this.state.showFilterList ? this._renderPreventClickView() : null}
        {this.state.canteenOptions ? this._renderFilterView() : null}
        {this.state.canteenDetail.length === 0 ?
          <ErrorPage style={{marginTop:-15}} errorToDo={this._onFilterEmptyData} errorTips="沒有數據哦,請點擊重試？"/> : null}
        {/* {this._renderSubHeader()} */}
        <Header style={{backgroundColor:this.props.screenProps.theme, borderBottomWidth: 0}} iosBarStyle="light-content">
          <Left>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('DrawerOpen')}>
              <View>
                <Icon name="md-apps" size={20} style={{color:'#fff'}}/>
              </View>
            </TouchableOpacity>
          </Left>
          <Body>
            <View style={styles.searchContainer}>
              <TextInput ref={(t) => this.textInput = t} style={styles.searchText}
                onFocus={() => {this.props.navigation.navigate('Search');this.textInput.blur()}}
                placeholder="请输入商店名称" underlineColorAndroid="transparent"/>
              <Icon name="md-search" size={20} style={styles.searchIcon}/>
            </View>
          </Body>
          <Right>
            <Icon onPress={() => this._openMapModal()}
              name="md-compass" size={25} style={{color: Colors.main_white}} />
          </Right>
        </Header>
        <View  style={{marginBottom:GLOBAL_PARAMS.bottomDistance}}>
          {this._renderSectionList()}
        </View>
      </Container>
    )
  }
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(247,247,247,1.0)',
  },
  searchContainer:{
    position: 'relative',
  },
  searchText: {
    height:35,
    width:GLOBAL_PARAMS._winWidth*0.6,
    backgroundColor: Colors.main_white,
    borderRadius:20,
    paddingLeft:20,
    marginTop: Platform.OS === 'ios' ? 0 : 3
  },
  searchIcon: {
    color: Colors.deep_gray,
    position:'absolute',
    fontSize: 22,
    top:Platform.OS === 'ios' ? 5 : 8,
    right:15
  }
})
