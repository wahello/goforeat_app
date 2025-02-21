import React, { Component } from "react";
import {
  View,
  TouchableOpacity,
  WebView,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  NativeModules,
  AlertIOS,
  ToastAndroid,
  Clipboard,
  Platform
} from "react-native";
import {
  Container,
  Header,
  Title,
  Right,
  Content,
  Badge,
  Card,
  CardItem,
  Thumbnail,
  Text,
  Button,
  Icon,
  Left,
  Body,
  Footer
} from "native-base";
import Image from 'react-native-image-progress';
import ProgressBar from 'react-native-progress/Bar'
import Share, {ShareSheet, Button as SButton} from 'react-native-share';
//utils
import ToastUtil from "../utils/ToastUtil";
import Colors from "../utils/Colors";
import GLOBAL_PARAMS from "../utils/global_params";
import LinkingUtils from '../utils/LinkingUtils';
//api
import api from "../api";
import source from '../api/CancelToken';
//components
import Loading from "../components/Loading";
import CommonHeader from "../components/CommonHeader";
import RecommendShop from "../components/RecommandShop";
import BlankPage from '../components/BlankPage';
import Rating from '../components/Rating';
//styles
import index_style from "../styles/index.style";

export default class ContentView extends Component {
  state = {
    favoriteChecked: false,
    canteenData: null,
    loading: true,
    shareboxVisible: false
  };

  componentDidMount() {
    // console.log(this.props);
    if(this.props.navigation.state.params.kind === "article") {
      for (let item of this.props.screenProps.articleList.data) {
        if (
          item !== null &&
          item.id === this.props.navigation.state.params.data.id
        ) {
          this.setState({
            favoriteChecked: true
          });
        }
      }
      return;
    }
    for (let item of this.props.screenProps.shopList.data) {
      if (
        item !== null &&
        item.id === this.props.navigation.state.params.data.id
      ) {
        this.setState({
          favoriteChecked: true
        });
      }
    }
    if (this.props.navigation.state.params.kind === "canteen") {
      this.getCanteenDetail();
    }
  }

  componentWillUnmount() {
    this.setState({
      canteenData: null
    });
    source.cancel()
  }

  //api
  getCanteenDetail() {
    api
      .getCanteenDetail(this.props.navigation.state.params.data.id)
      .then(data => {
        if (data.status === 200 && data.data.ro.ok) {
          console.log(data.data);
          this.setState({
            canteenData: data.data.data
          });
        }
      });
  }

  _addNewsToFavorite() {
    if (this.props.screenProps.user === null) {
      ToastUtil.showWithMessage("請先登錄哦");
      this.props.navigation.navigate('Login');
      return;
    }
    let {kind,data} = this.props.navigation.state.params;
    let {stockShop,deleteShop,stockArticle,deleteArticle} = this.props.screenProps;

    // if (this.props.navigation.state.params.kind === "article") {
    //   ToastUtil.showWithMessage("暫未開放收藏文章");
    //   return;
    // }
    if (!this.state.favoriteChecked) {
      this.setState({
        favoriteChecked: true
      });
      kind === 'article'? stockArticle(data) : stockShop(data);
      ToastUtil.showWithMessage("關注成功");
    } else {
      this.setState({
        favoriteChecked: false
      });
      kind === 'article'? deleteArticle(data.id) : deleteShop(data.id);
      ToastUtil.showWithMessage("取消關注成功");
    }
  }

  openShare = () => {
    if (this.props.navigation.state.params.kind === "canteen") {
      ToastUtil.showWithMessage("暫未開放分享店鋪");
      return;
    }
    this.setState({shareboxVisible: true})
  }

  cancelShare = () => this.setState({shareboxVisible: false})

  _shareLink = (type) => {
    let {data,kind} = this.props.navigation.state.params;
    const shareOptions = {
      url: kind === 'canteen' ? 'http://goforeat.hk' : data.url,
      message: 'goforeat',
      title: data.title
    };
    this.cancelShare();
    if(type !== 'url') {
      setTimeout(() => {
        Share.shareSingle(Object.assign(shareOptions, {
          "social": type
        })).catch((err) => { 
          return;
        });
      },300);
    }else {
      setTimeout(() => {
        if(typeof shareOptions["url"] !== undefined) {
          Clipboard.setString(shareOptions["url"]);
          if (Platform.OS === "android") {
            ToastAndroid.show('找不到該鏈接', ToastAndroid.SHORT);
          } else if (Platform.OS === "ios") {
            AlertIOS.alert('找不到該鏈接');
          }
        }
      },300);
    }
  }

  _phonecall = () => {
    if(!this.state.canteenData.phone) {
      ToastUtil.showWithMessage('暫無商店電話');
      return;
    }
    LinkingUtils.dialPhoneWithNumber(this.state.canteenData.phone)
  }

  _renderShareSheet = () => {
    return (<ShareSheet visible={this.state.shareboxVisible} onCancel={this.cancelShare.bind(this)} style={{zIndex:999}}>
          <SButton iconSrc={require('../asset/Twitter.png')}
                  onPress={()=>this._shareLink('twitter')}><Text style={{marginTop:3}}>Twitter</Text></SButton>
          <SButton iconSrc={require('../asset/facebook.png')}
                  onPress={()=>this._shareLink('facebook')}><Text style={{marginTop:3}}>Facebook</Text></SButton>
          <SButton iconSrc={require('../asset/whatsapp.png')}
                  onPress={()=>this._shareLink('whatsapp')}><Text style={{marginTop:3}}>Whatsapp</Text></SButton>
          <SButton iconSrc={require('../asset/googleplus.png')}
                  onPress={()=>this._shareLink('googleplus')}><Text style={{marginTop:3}}>Google</Text> +</SButton>
          <SButton iconSrc={require('../asset/email.png')}
                  onPress={()=>this._shareLink('email')}><Text style={{marginTop:3}}>Email</Text></SButton>
          <SButton iconSrc={require('../asset/link.png')}
            onPress={()=>this._shareLink('url')}><Text style={{marginTop:3}}>Copy Link</Text></SButton>
          <SButton iconSrc={require('../asset/more.png')}
          onPress={()=>{
            this.cancelShare();
            setTimeout(() => {
              Share.open(shareOptions)
            },300);
          }}><Text style={{marginTop:3}}>More</Text></SButton>
        </ShareSheet>
  )}

  _renderContentView = () => (
    <Content>
      <Card style={{ flex:1,margin:0 ,borderWidth:0}}>
        <CardItem>
          <Left>
            <Image style={{width:100, height:100,borderRadius: 50}} imageStyle={{borderRadius: 50}}
            source={{ uri: this.state.canteenData.image === '#' ? 'default_image' : this.state.canteenData.image }} />
            <Body>
              <Text note style={{marginTop:5,marginBottom: 5}}>{this.state.canteenData.name}</Text>
              <Text note style={{marginTop:5,marginBottom: 5}}>{this.state.canteenData.address}</Text>
              <Text note style={{marginTop:5,marginBottom: 5}}>價格：${this.state.canteenData.price}</Text>
              <Rating rate={this.state.canteenData.rate} {...this['props']}/>
            </Body>
          </Left>
        </CardItem>
        <CardItem>
          <Body>
            <View style={[styles.subtitle,{borderLeftColor: this.props.screenProps.theme}]}>
              <Text>餐廳菜品</Text>
            </View>
            {this.state.canteenData.foods.length > 0 ? (
              this.state.canteenData.foods.map((item, idx) => (
                <Image
                  key={idx}
                  style={{
                    width: GLOBAL_PARAMS._winWidth * 0.91,
                    height: 200,
                    marginTop: 10,
                    marginBottom: 10
                  }}
                  indicator={ProgressBar}
                  indicatorProps={{color:this.props.screenProps.theme}}
                  source={{ uri: item.foodImage }}
                />
              ))
            ) : <BlankPage message="暫無菜品數據"/>}

          </Body>
        </CardItem>
        <CardItem>
        <Body>
          <View style={[styles.subtitle,{borderLeftColor: this.props.screenProps.theme,marginBottom: 10}]}>
            <Text>餐廳推薦</Text>
          </View>
          {
            RecommendShop({list: this.state.canteenData.recommendCanteen,...this['props']})
          }
        </Body>
        </CardItem>
      </Card>
    </Content>
  );

  _renderArticleContentView = () => (
    <WebView
      bounces={true}
      scalesPageToFit={true}
      source={{ uri: this.props.navigation.state.params.data.url }}
      style={{
        width: GLOBAL_PARAMS._winWidth,
        height: GLOBAL_PARAMS._winHeight
      }}
    />
  );

  render() {
    let {kind} = this.props.navigation.state.params;
    return (
      <Container>
      
        <Header style={{backgroundColor: this.props.screenProps.theme}} iosBarStyle="light-content">
          <Left>
          <Button transparent onPress={() => this.props.navigation.goBack()}>
            <Icon size={20} name="ios-arrow-back" style={{fontSize:25,color: Colors.main_white}}/>
          </Button></Left>
          <Body><Text style={{color: Colors.main_white}}>{this.props.navigation.state.params.kind === 'canteen' ? '餐廳詳情' : '文章詳情'}</Text></Body>
          <Right><Button transparent onPress={() => this.setState({shareboxVisible: true})}>
            <Icon name="md-share-alt" style={{ fontSize: 23, color: Colors.main_white }}/>
          </Button>
          </Right>
        </Header>
        <View style={{flex:1}}>
            {this.props.navigation.state.params.kind === "article"
            ? this._renderArticleContentView()
            : null}
          {this.state.canteenData !== null ? this._renderContentView() : null}
          {this._renderShareSheet()}
        </View>
        {kind === 'canteen' ? <Footer style={{zIndex:1}}>
            <TouchableOpacity 
            style={{height:60,width:GLOBAL_PARAMS._winWidth*0.3,flexDirection:'row',justifyContent:'center',alignItems:'center'}} 
            onPress={() => this._addNewsToFavorite()}>
            {this.state.favoriteChecked ? (
              <Icon
                name="md-heart"
                style={{ fontSize: 20, color: this.props.screenProps.theme }}
              />
            ) : (
              <Icon
                name="md-heart-outline"
                style={{ color: this.props.screenProps.theme, fontSize: 25 }}
              />
            )}
            {this.state.favoriteChecked? (<Text style={{marginLeft: 10,color: this.props.screenProps.theme}}>已關注</Text>) : 
            (<Text style={{marginLeft: 10,color: this.props.screenProps.theme}}>關注</Text>)}
            </TouchableOpacity>
            <TouchableOpacity 
            onPress={() => this._phonecall()}
            style={{height:60,width:GLOBAL_PARAMS._winWidth*0.35,backgroundColor:Colors.main_blue,
              flexDirection: 'row',alignItems:'center',justifyContent:'center'}}>
                <Icon name="md-call" style={{fontSize:18,color:Colors.main_white}}/>
                <Text style={{color:Colors.main_white,marginLeft:10}}>撥打電話</Text>  
            </TouchableOpacity>
            <TouchableOpacity 
            onPress={() => this.props.navigation.navigate('Comment',{comment: this.state.canteenData.comment})}
            style={{height:60,width:GLOBAL_PARAMS._winWidth*0.35,backgroundColor:Colors.middle_green,
              flexDirection:'row',alignItems:'center',justifyContent:'center'}}>
                <Icon name="ios-chatbubbles" style={{fontSize: 20,color:Colors.main_white}}/>
                <Text style={{color:Colors.main_white,marginLeft:10}}>查看評論</Text>
            </TouchableOpacity>
        </Footer> : null}
    </Container>

    );
  }
}


const styles = StyleSheet.create({
  subtitle: {
    borderLeftWidth: 6,
    paddingLeft: 10,
  }
})